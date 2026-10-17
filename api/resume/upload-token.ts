import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { authenticateRequest, verifyCsrf } from '../_lib/auth';

async function parseBody(req: any): Promise<HandleUploadBody> {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {} as HandleUploadBody; }
  }
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk: any) => { data += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(data)); } catch { resolve({} as HandleUploadBody); }
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

  try {
    const body = await parseBody(req);

    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => {
        // Double-check session inside hook
        if (!session) {
          throw new Error('Unauthorized session for blob token generation');
        }

        return {
          allowedContentTypes: ['application/pdf'],
          maximumSizeInBytes: 10 * 1024 * 1024, // 10MB
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ username: session.username }),
        };
      },
      onUploadCompleted: async () => {
        // Staging upload completed; client will call /api/resume/finalize to promote
      },
    });

    return res.status(200).json(jsonResponse);
  } catch (error: unknown) {
    console.error('Error generating upload token:', error);
    return res.status(400).json({
      error: error instanceof Error ? error.message : 'Upload token generation failed',
    });
  }
}
