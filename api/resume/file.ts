import { getActiveResumeStatus } from '../_lib/blob';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400');

  try {
    const resume = await getActiveResumeStatus();

    // If active blob exists and has external URL, redirect directly
    if (resume.url.startsWith('http://') || resume.url.startsWith('https://')) {
      res.setHeader('Location', resume.url);
      return res.status(307).end();
    }

    // Static fallback: redirect to local static file
    res.setHeader('Location', resume.url);
    return res.status(307).end();
  } catch (err: unknown) {
    console.error('Error redirecting to resume file:', err);
    res.setHeader('Location', '/Umesh-Temburwar-OCT.pdf');
    return res.status(307).end();
  }
}
