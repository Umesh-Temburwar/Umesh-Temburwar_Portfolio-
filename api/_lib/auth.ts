import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { SignJWT, jwtVerify } from 'jose';
import type { IncomingMessage, ServerResponse } from 'node:http';

export function getEnvVar(key: string): string | undefined {
  try {
    const envLocalPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envLocalPath)) {
      const content = fs.readFileSync(envLocalPath, 'utf-8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [k, ...v] = trimmed.split('=');
          if (k.trim() === key) {
            const val = v.join('=').trim().replace(/^["'](.*)["']$/, '$1');
            process.env[key] = val;
            return val;
          }
        }
      }
    }
  } catch {
    // ignore
  }
  return process.env[key];
}

const COOKIE_NAME = 'resume_admin_session';
const SESSION_EXPIRY_SECONDS = 60 * 60 * 24; // 24 hours

// In-memory rate limiting map for best-effort serverless protection
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();

export function getClientIp(req: IncomingMessage): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

export function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now });
    return { allowed: true };
  }

  // Reset count after 15 minutes of inactivity
  if (now - entry.lastAttempt > 15 * 60 * 1000) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now });
    return { allowed: true };
  }

  entry.count += 1;
  entry.lastAttempt = now;

  // Max 5 attempts per 15 minutes per IP instance
  if (entry.count > 5) {
    const retryAfter = Math.ceil((entry.lastAttempt + 15 * 60 * 1000 - now) / 1000);
    return { allowed: false, retryAfter };
  }

  return { allowed: true };
}

export function clearRateLimit(ip: string) {
  loginAttempts.delete(ip);
}

// Scrypt password verification
export function verifyPassword(password: string, storedHash: string): boolean {
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

    if (derivedKey.length !== keyBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(derivedKey, keyBuf);
  } catch {
    return false;
  }
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt.toString('hex')}:${derivedKey.toString('hex')}`;
}

function getJwtSecret(): Uint8Array {
  const secret = getEnvVar('SESSION_SECRET') || 'fallback_dev_secret_must_be_32_chars_long!';
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(username: string): Promise<string> {
  const secret = getJwtSecret();
  return await new SignJWT({ username, role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_EXPIRY_SECONDS}s`)
    .sign(secret);
}

export async function verifySessionToken(token: string): Promise<{ username: string } | null> {
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

export function parseCookies(req: IncomingMessage): Record<string, string> {
  const list: Record<string, string> = {};
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return list;

  cookieHeader.split(';').forEach((cookie) => {
    const parts = cookie.split('=');
    const name = parts.shift()?.trim();
    if (name) {
      list[name] = decodeURIComponent(parts.join('='));
    }
  });

  return list;
}

export function setSessionCookie(res: ServerResponse, token: string) {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieValue = `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=${SESSION_EXPIRY_SECONDS}; HttpOnly; SameSite=Strict${
    isProd ? '; Secure' : ''
  }`;
  res.setHeader('Set-Cookie', cookieValue);
}

export function clearSessionCookie(res: ServerResponse) {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieValue = `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict${isProd ? '; Secure' : ''}`;
  res.setHeader('Set-Cookie', cookieValue);
}

export async function authenticateRequest(req: IncomingMessage): Promise<{ username: string } | null> {
  const cookies = parseCookies(req);
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  return await verifySessionToken(token);
}

export function generateCsrfToken(sessionToken: string): string {
  const secret = process.env.SESSION_SECRET || 'dev_secret';
  return crypto.createHmac('sha256', secret).update(sessionToken).digest('hex');
}

export function verifyCsrf(req: IncomingMessage): boolean {
  // Check custom header requirement
  const requestedWith = req.headers['x-requested-with'];
  const csrfHeader = req.headers['x-csrf-token'];
  const origin = req.headers.origin;
  const host = req.headers.host;

  if (origin && host) {
    try {
      const originHost = new URL(origin).host;
      if (originHost !== host) return false;
    } catch {
      return false;
    }
  }

  // Valid if either X-Requested-With: XMLHttpRequest or valid CSRF token is supplied
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
