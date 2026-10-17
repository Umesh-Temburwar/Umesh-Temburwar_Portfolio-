import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  getClientIp,
  checkRateLimit,
  clearRateLimit,
  verifyPassword,
  createSessionToken,
  setSessionCookie,
  generateCsrfToken,
  verifyCsrf,
  getEnvVar,
} from '../_lib/auth';

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

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  // Verify CSRF / origin
  if (!verifyCsrf(req)) {
    return res.status(403).json({ error: 'CSRF / origin verification failed' });
  }

  // Rate limiting check
  const ip = getClientIp(req);
  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    return res.status(429).json({
      error: `Too many login attempts. Please try again in ${rateLimit.retryAfter || 60} seconds.`,
    });
  }

  const body = await parseBody(req);
  const { username, password } = body;

  const expectedUsername = getEnvVar('ADMIN_USERNAME') || 'admin';
  const expectedHash = getEnvVar('ADMIN_PASSWORD_HASH');

  if (!expectedHash) {
    console.error('ADMIN_PASSWORD_HASH environment variable is not configured');
    return res.status(500).json({ error: 'Authentication service not configured on server' });
  }

  // Constant-time check: username must match and password must verify
  const usernameMatches = username === expectedUsername;
  const passwordMatches = verifyPassword(password || '', expectedHash);

  if (!usernameMatches || !passwordMatches) {
    // Artificial 500ms delay to thwart timing attacks and brute-force
    await new Promise((r) => setTimeout(r, 500));
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Success: clear rate limit counter and issue token
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
