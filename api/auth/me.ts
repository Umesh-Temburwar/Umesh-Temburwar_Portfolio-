import { authenticateRequest, generateCsrfToken, parseCookies } from '../_lib/auth';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Cache-Control', 'no-store');

  const session = await authenticateRequest(req);
  if (!session) {
    return res.status(401).json({ authenticated: false });
  }

  const cookies = parseCookies(req);
  const token = cookies['resume_admin_session'] || '';
  const csrfToken = token ? generateCsrfToken(token) : '';

  return res.status(200).json({
    authenticated: true,
    user: { username: session.username },
    csrfToken,
  });
}
