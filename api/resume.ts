import { head, put, del } from '@vercel/blob';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { authenticateRequest, verifyCsrf } from './auth.js';

export const ACTIVE_RESUME_PATHNAME = 'resume/resume.pdf';
export const STATIC_FALLBACK_URL = '/Umesh-Temburwar-OCT.pdf';
export const STATIC_FALLBACK_FILENAME = 'Umesh-Temburwar-OCT.pdf';

export interface ResumeStatus {
  url: string;
  downloadUrl: string;
  filename: string;
  size: number | null;
  uploadedAt: string | null;
  exists: boolean;
  isFallback: boolean;
}

function hasBlobConfig(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function getActiveResumeStatus(): Promise<ResumeStatus> {
  if (!hasBlobConfig()) {
    return {
      url: STATIC_FALLBACK_URL,
      downloadUrl: STATIC_FALLBACK_URL,
      filename: STATIC_FALLBACK_FILENAME,
      size: null,
      uploadedAt: null,
      exists: true,
      isFallback: true,
    };
  }

  try {
    const blobDetails = await head(ACTIVE_RESUME_PATHNAME);
    if (blobDetails && blobDetails.url) {
      return {
        url: blobDetails.url,
        downloadUrl: blobDetails.downloadUrl || blobDetails.url,
        filename: 'resume.pdf',
        size: blobDetails.size,
        uploadedAt: blobDetails.uploadedAt ? blobDetails.uploadedAt.toISOString() : null,
        exists: true,
        isFallback: false,
      };
    }
  } catch (err: unknown) {
    const errObj = err as { status?: number; name?: string };
    if (errObj && errObj.status !== 404 && errObj.name !== 'BlobNotFoundError') {
      console.warn('Vercel Blob head check returned error:', err);
    }
  }

  return {
    url: STATIC_FALLBACK_URL,
    downloadUrl: STATIC_FALLBACK_URL,
    filename: STATIC_FALLBACK_FILENAME,
    size: null,
    uploadedAt: null,
    exists: true,
    isFallback: true,
  };
}

async function validateAndRetrieveStagingBlob(
  stagingUrl: string
): Promise<{ valid: boolean; buffer?: Buffer; error?: string }> {
  try {
    if (!hasBlobConfig()) {
      return { valid: false, error: 'Blob storage not configured.' };
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(stagingUrl);
    } catch {
      return { valid: false, error: 'Invalid staging URL provided.' };
    }

    // Ensure staging URL points to Vercel Blob storage
    if (!parsedUrl.hostname.endsWith('blob.vercel-storage.com')) {
      return { valid: false, error: 'Staging URL does not point to Vercel Blob storage.' };
    }

    // Ensure it is in staging/
    if (!parsedUrl.pathname.includes('/staging/')) {
      return { valid: false, error: 'Only staging files can be finalized.' };
    }

    // Fetch the staging blob (public blob)
    const response = await fetch(stagingUrl);
    if (!response.ok) {
      return { valid: false, error: `Staging blob could not be retrieved (${response.status}).` };
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > 10 * 1024 * 1024) {
      return { valid: false, error: 'File size exceeds 10MB limit.' };
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length === 0) {
      return { valid: false, error: 'Uploaded file is empty.' };
    }

    if (buffer.length > 10 * 1024 * 1024) {
      return { valid: false, error: 'File size exceeds 10MB limit.' };
    }

    // Magic bytes verification: must start with %PDF-
    const magic = buffer.subarray(0, 5).toString('ascii');
    if (!magic.startsWith('%PDF-')) {
      return { valid: false, error: 'Corrupt or invalid PDF file (magic bytes mismatch).' };
    }

    return { valid: true, buffer };
  } catch (err: unknown) {
    return { valid: false, error: err instanceof Error ? err.message : 'Validation error.' };
  }
}

async function promoteValidatedBuffer(
  buffer: Buffer,
  stagingUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Put to fixed active pathname with public access
    await put(ACTIVE_RESUME_PATHNAME, buffer, {
      access: 'public',
      allowOverwrite: true,
      addRandomSuffix: false,
      contentType: 'application/pdf',
      cacheControlMaxAge: 60,
    });

    // Delete obsolete staging blob only after promotion succeeded
    try {
      await del(stagingUrl);
    } catch (delErr) {
      console.warn('Failed to delete staging blob after promotion:', delErr);
    }

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Promotion failed.' };
  }
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
  if (url.includes('/file')) return 'file';
  if (url.includes('/upload-token')) return 'upload-token';
  if (url.includes('/finalize')) return 'finalize';
  return '';
}

export default async function handler(req: any, res: any) {
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

  try {
    const action = resolveAction(req);

    // 1. GET /api/resume/file (or /resume.pdf redirect/stream)
    if (action === 'file') {
      if (!hasBlobConfig()) {
        res.setHeader('Location', STATIC_FALLBACK_URL);
        return res.status(307).end();
      }

      try {
        const blobDetails = await head(ACTIVE_RESUME_PATHNAME);
        if (!blobDetails || !blobDetails.url) {
          res.setHeader('Location', STATIC_FALLBACK_URL);
          return res.status(307).end();
        }

        const isDownload = req.query?.download === '1' || req.query?.download === 'true';
        const targetUrl = isDownload ? (blobDetails.downloadUrl || blobDetails.url) : blobDetails.url;

        res.setHeader('Location', targetUrl);
        res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400');
        return res.status(307).end();
      } catch (err: unknown) {
        const errObj = err as { status?: number; name?: string };
        if (errObj && errObj.status !== 404 && errObj.name !== 'BlobNotFoundError') {
          console.warn('Vercel Blob head check failed, falling back to static:', err);
        }
        res.setHeader('Location', STATIC_FALLBACK_URL);
        return res.status(307).end();
      }
    }

    // 2. POST /api/resume/upload-token
    if (action === 'upload-token') {
      if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method Not Allowed' });
      }

      const session = await authenticateRequest(req);
      if (!session) {
        return res.status(401).json({ error: 'Unauthorized: Admin session required' });
      }

      if (!verifyCsrf(req)) {
        return res.status(403).json({ error: 'CSRF verification failed' });
      }

      try {
        const body = (await parseBody(req)) as HandleUploadBody;
        const jsonResponse = await handleUpload({
          body,
          request: req,
          onBeforeGenerateToken: async (pathname) => {
            if (!pathname.toLowerCase().endsWith('.pdf')) {
              throw new Error('Only PDF files are permitted for upload');
            }

            return {
              allowedContentTypes: ['application/pdf'],
              maximumSizeInBytes: 10 * 1024 * 1024,
              addRandomSuffix: true,
              tokenPayload: JSON.stringify({ username: session.username }),
            };
          },
          onUploadCompleted: async () => {},
        });

        return res.status(200).json(jsonResponse);
      } catch (err: unknown) {
        return res.status(400).json({
          error: err instanceof Error ? err.message : 'Upload token generation failed',
        });
      }
    }

    // 3. POST /api/resume/finalize
    if (action === 'finalize') {
      if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method Not Allowed' });
      }

      const session = await authenticateRequest(req);
      if (!session) {
        return res.status(401).json({ error: 'Unauthorized: Admin session required' });
      }

      if (!verifyCsrf(req)) {
        return res.status(403).json({ error: 'CSRF verification failed' });
      }

      const body = await parseBody(req);
      const { stagingUrl, filename } = body;

      if (!stagingUrl || typeof stagingUrl !== 'string') {
        return res.status(400).json({ error: 'Missing stagingUrl parameter' });
      }

      const validation = await validateAndRetrieveStagingBlob(stagingUrl);
      if (!validation.valid || !validation.buffer) {
        try {
          await del(stagingUrl);
        } catch {}
        return res.status(400).json({
          error: validation.error || 'Uploaded file failed server security validation.',
        });
      }

      const promotion = await promoteValidatedBuffer(validation.buffer, stagingUrl);
      if (!promotion.success) {
        return res.status(500).json({
          error: promotion.error || 'Failed to promote staging blob to active resume.',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Resume validated and activated successfully.',
        url: '/api/resume/file',
        filename: filename || 'resume.pdf',
      });
    }

    // 4. Default: /api/resume (no action)
    if (req.method === 'GET') {
      res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400');
      try {
        const status = await getActiveResumeStatus();
        return res.status(200).json(status);
      } catch {
        return res.status(200).json({
          url: STATIC_FALLBACK_URL,
          downloadUrl: STATIC_FALLBACK_URL,
          filename: STATIC_FALLBACK_FILENAME,
          size: null,
          uploadedAt: null,
          exists: true,
          isFallback: true,
        });
      }
    }

    if (req.method === 'DELETE') {
      res.setHeader('Cache-Control', 'no-store');

      const session = await authenticateRequest(req);
      if (!session) {
        return res.status(401).json({ error: 'Unauthorized: Admin session required' });
      }

      if (!verifyCsrf(req)) {
        return res.status(403).json({ error: 'CSRF verification failed' });
      }

      try {
        if (hasBlobConfig()) {
          await del(ACTIVE_RESUME_PATHNAME);
        }
        const updatedStatus = await getActiveResumeStatus();
        return res.status(200).json({
          success: true,
          message: 'Active resume deleted. Reverted to static fallback.',
          status: updatedStatus,
        });
      } catch (err: unknown) {
        return res.status(500).json({
          error: err instanceof Error ? err.message : 'Failed to delete resume',
        });
      }
    }

    res.setHeader('Allow', 'GET, DELETE');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err: unknown) {
    console.error('Unhandled resume handler error:', err);
    return res.status(500).json({
      error: 'An unexpected server error occurred in resume service.',
    });
  }
}
