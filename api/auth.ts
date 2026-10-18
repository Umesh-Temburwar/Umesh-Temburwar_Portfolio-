import * as crypto from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';

const COOKIE_NAME = 'resume_admin_session';
const SESSION_EXPIRY_SECONDS = 60 * 60 * 24; // 24 hours

// Default credentials for UMESH / ARUNA7709 (can be overridden via Vercel env vars)
const DEFAULT_USERNAME = 'UMESH';
const DEFAULT_PASSWORD_HASH =
  '857cfe580f5e7eafafb244dffaf99bc9:af4bf887597185702d600112344dee543c3fbb3b1554a1e149f1e3df2eb6ac5c6b9b344ea44ebd1e76b9ced847a671e4436efddfe6b62482c6dddd9b4f24d236';
const DEFAULT_SESSION_SECRET = '4ce080a01c164e6fd88fb30f06c56ee70273ba42cd481845e4d9af8c19a9aad0';

// In-memory rate limiting map
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();

function getClientIp(req: any): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now });
    return { allowed: true };
  }

  if (now - entry.lastAttempt > 15 * 60 * 1000) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now });
    return { allowed: true };
  }

  entry.count += 1;
  entry.lastAttempt = now;

  if (entry.count > 5) {
    const retryAfter = Math.ceil((entry.lastAttempt + 15 * 60 * 1000 - now) / 1000);
    return { allowed: false, retryAfter };
  }

  return { allowed: true };
}

function clearRateLimit(ip: string) {
  loginAttempts.delete(ip);
}

function verifyPassword(password: string, storedHash: string): boolean {
  try {
    if (!storedHash || typeof storedHash !== 'string') return false;
    const parts = storedHash.split(':');
    if (parts.length !== 2) return false;

    const [salt, key] = parts;
    if (!salt || !key) return false;

    const saltBuf = Buffer.from(salt, 'hex');
    const keyBuf = Buffer.from(key, 'hex');
    if (saltBuf.length === 0 || keyBuf.length === 0) return false;

    const derivedKey = crypto.scryptSync(password, saltBuf, keyBuf.length);
    if (derivedKey.length !== keyBuf.length) return false;

    return crypto.timingSafeEqual(derivedKey, keyBuf);
  } catch {
    return false;
  }
}

function getJwtSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET || DEFAULT_SESSION_SECRET;
  return new TextEncoder().encode(secret);
}

async function createSessionToken(username: string): Promise<string> {
  const secret = getJwtSecret();
  return await new SignJWT({ username, role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_EXPIRY_SECONDS}s`)
    .sign(secret);
}

async function verifySessionToken(token: string): Promise<{ username: string } | null> {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret);
    if (payload.username && typeof payload.username === 'string') {
      return { username: payload.username };
    }
    return null;
  } catch {
    return null;
  }
}

function parseCookies(req: any): Record<string, string> {
  const list: Record<string, string> = {};
  const cookieHeader = req.headers?.cookie;
  if (!cookieHeader) return list;

  cookieHeader.split(';').forEach((cookie: string) => {
    const parts = cookie.split('=');
    const name = parts.shift()?.trim();
    if (name) {
      list[name] = decodeURIComponent(parts.join('='));
    }
  });

  return list;
}

function setSessionCookie(res: any, token: string) {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieValue = `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=${SESSION_EXPIRY_SECONDS}; HttpOnly; SameSite=Strict${
    isProd ? '; Secure' : ''
  }`;
  res.setHeader('Set-Cookie', cookieValue);
}

function clearSessionCookie(res: any) {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieValue = `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict${isProd ? '; Secure' : ''}`;
  res.setHeader('Set-Cookie', cookieValue);
}

export async function authenticateRequest(req: any): Promise<{ username: string } | null> {
  const cookies = parseCookies(req);
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  return await verifySessionToken(token);
}

export function generateCsrfToken(sessionToken: string): string {
  const secret = process.env.SESSION_SECRET || DEFAULT_SESSION_SECRET;
  return crypto.createHmac('sha256', secret).update(sessionToken).digest('hex');
}

export function verifyCsrf(req: any): boolean {
  const requestedWith = req.headers?.['x-requested-with'];
  const csrfHeader = req.headers?.['x-csrf-token'];
  const origin = req.headers?.origin;
  const host = req.headers?.host;

  if (origin && host) {
    try {
      const originHost = new URL(origin).host;
      if (originHost !== host) return false;
    } catch {
      return false;
    }
  }

  if (requestedWith === 'XMLHttpRequest') {
    return true;
  }

  if (csrfHeader && typeof csrfHeader === 'string') {
    const cookies = parseCookies(req);
    const token = cookies[COOKIE_NAME];
    if (token) {
      const expected = generateCsrfToken(token);
      return crypto.timingSafeEqual(Buffer.from(csrfHeader), Buffer.from(expected));
    }
  }

  return false;
}

async function parseBody(req: any): Promise<any> {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk: any) => { data += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(data)); } catch { resolve({}); }
    });
  });
}

function resolveAction(req: any): string {
  if (req.query?.action) {
    return String(req.query.action);
  }
  const url = req.url || '';
  if (url.includes('/login')) return 'login';
  if (url.includes('/logout')) return 'logout';
  if (url.includes('/me')) return 'me';
  return '';
}

export default async function handler(req: any, res: any) {
  // Ensure response helper methods exist
  if (!res.status) {
    res.status = (code: number) => { res.statusCode = code; return res; };
  }
  if (!res.json) {
    res.json = (data: any) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
      return res;
    };
  }

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  try {
    const action = resolveAction(req);

  // 1. GET /api/auth/me
  if (action === 'me') {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return res.status(405).json({ error: 'Method Not Allowed' });
    }
    res.setHeader('Cache-Control', 'no-store');

    const session = await authenticateRequest(req);
    if (!session) {
      return res.status(401).json({ authenticated: false });
    }

    const cookies = parseCookies(req);
    const token = cookies[COOKIE_NAME] || '';
    const csrfToken = token ? generateCsrfToken(token) : '';

    return res.status(200).json({
      authenticated: true,
      user: { username: session.username },
      csrfToken,
    });
  }

  // 2. POST /api/auth/login
  if (action === 'login') {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    if (!verifyCsrf(req)) {
      return res.status(403).json({ error: 'CSRF verification failed' });
    }

    const ip = getClientIp(req);
    const rateLimit = checkRateLimit(ip);
    if (!rateLimit.allowed) {
      return res.status(429).json({
        error: `Too many login attempts. Please try again in ${rateLimit.retryAfter || 60} seconds.`,
      });
    }

    const body = await parseBody(req);
    const { username, password } = body;

    const expectedUsername = process.env.ADMIN_USERNAME || DEFAULT_USERNAME;
    const expectedHash = process.env.ADMIN_PASSWORD_HASH || DEFAULT_PASSWORD_HASH;

    const usernameMatches = Boolean(
      username &&
      expectedUsername &&
      username.trim().toLowerCase() === expectedUsername.trim().toLowerCase()
    );
    const passwordMatches = verifyPassword(password || '', expectedHash);

    if (!usernameMatches || !passwordMatches) {
      await new Promise((r) => setTimeout(r, 500));
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    clearRateLimit(ip);
    const token = await createSessionToken(username);
    setSessionCookie(res, token);
    const csrfToken = generateCsrfToken(token);

    return res.status(200).json({
      success: true,
      csrfToken,
      user: { username },
    });
  }

  // 3. POST /api/auth/logout
  if (action === 'logout') {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    if (!verifyCsrf(req)) {
      return res.status(403).json({ error: 'CSRF verification failed' });
    }

    clearSessionCookie(res);
    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  }

    return res.status(404).json({ error: 'Unknown auth action' });
  } catch (err: unknown) {
    console.error('Unhandled auth handler error:', err);
    return res.status(500).json({
      error: 'An unexpected server error occurred in authentication service.',
    });
  }
}
