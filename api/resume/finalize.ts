import { validateStagingBlob, promoteStagingResume } from '../_lib/blob';
import { authenticateRequest, verifyCsrf } from '../_lib/auth';

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

  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Verify authentication
  const session = await authenticateRequest(req);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized: Admin session required' });
  }

  // Verify CSRF / origin
  if (!verifyCsrf(req)) {
    return res.status(403).json({ error: 'CSRF verification failed' });
  }

  const body = await parseBody(req);
  const { stagingUrl, filename } = body;

  if (!stagingUrl || typeof stagingUrl !== 'string') {
    return res.status(400).json({ error: 'Missing stagingUrl parameter' });
  }

  // 1. Server-side validation of staging blob (size, content type, %PDF- magic bytes)
  const validation = await validateStagingBlob(stagingUrl);
  if (!validation.valid) {
    return res.status(400).json({
      error: validation.error || 'Uploaded file failed server security validation.',
    });
  }

  // 2. Promote validated staging blob to active resume/resume.pdf and delete staging
  const promotion = await promoteStagingResume(stagingUrl, filename);
  if (!promotion.success) {
    return res.status(500).json({
      error: promotion.error || 'Failed to promote staging blob to active resume.',
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Resume validated and activated successfully.',
    url: promotion.url,
    filename: filename || 'resume.pdf',
  });
}
