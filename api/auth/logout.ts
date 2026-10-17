import { clearSessionCookie, verifyCsrf } from '../_lib/auth';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  if (!verifyCsrf(req)) {
    return res.status(403).json({ error: 'CSRF verification failed' });
  }

  clearSessionCookie(res);
  return res.status(200).json({ success: true, message: 'Logged out successfully' });
}
