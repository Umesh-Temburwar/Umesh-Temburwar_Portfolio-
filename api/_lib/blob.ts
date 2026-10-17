import { head, put, del } from '@vercel/blob';

export const ACTIVE_RESUME_PATHNAME = 'resume/resume.pdf';
export const STATIC_FALLBACK_URL = '/Umesh-Temburwar-OCT.pdf';
export const STATIC_FALLBACK_FILENAME = 'Umesh-Temburwar-OCT.pdf';

export interface ResumeStatus {
  url: string;
  filename: string;
  size: number | null;
  uploadedAt: string | null;
  exists: boolean;
  isFallback: boolean;
}

export function hasBlobConfig(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function getActiveResumeStatus(): Promise<ResumeStatus> {
  if (!hasBlobConfig()) {
    return {
      url: STATIC_FALLBACK_URL,
      filename: STATIC_FALLBACK_FILENAME,
      size: null,
      uploadedAt: null,
      exists: true,
      isFallback: true,
    };
  }

  try {
    // Try to get head for active resume pathname
    const blobDetails = await head(ACTIVE_RESUME_PATHNAME);
    if (blobDetails && blobDetails.url) {
      return {
        url: blobDetails.url,
        filename: 'resume.pdf',
        size: blobDetails.size,
        uploadedAt: blobDetails.uploadedAt ? blobDetails.uploadedAt.toISOString() : null,
        exists: true,
        isFallback: false,
      };
    }
  } catch (err: unknown) {
    // Not found in blob store or error -> fallback to static
    const errObj = err as { status?: number };
    if (errObj && errObj.status !== 404) {
      console.warn('Vercel Blob head check returned error:', err);
    }
  }

  return {
    url: STATIC_FALLBACK_URL,
    filename: STATIC_FALLBACK_FILENAME,
    size: null,
    uploadedAt: null,
    exists: true,
    isFallback: true,
  };
}

export async function validateStagingBlob(stagingUrl: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const stagingDetails = await head(stagingUrl);
    if (!stagingDetails) {
      return { valid: false, error: 'Staging blob could not be located.' };
    }

    if (stagingDetails.size > 10 * 1024 * 1024) {
      return { valid: false, error: 'File size exceeds 10MB limit.' };
    }

    // Verify magic bytes: Fetch first 8 bytes of the file
    const rangeRes = await fetch(stagingUrl, {
      headers: { Range: 'bytes=0-7' },
    });

    if (!rangeRes.ok && rangeRes.status !== 206) {
      return { valid: false, error: 'Failed to inspect file magic bytes.' };
    }

    const arrayBuffer = await rangeRes.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const magic = String.fromCharCode(...bytes.slice(0, 5));

    // Valid PDF starts with "%PDF-"
    if (!magic.startsWith('%PDF-')) {
      return { valid: false, error: 'Corrupt or invalid PDF file (magic bytes mismatch).' };
    }

    return { valid: true };
  } catch (err: unknown) {
    return { valid: false, error: err instanceof Error ? err.message : 'Validation error.' };
  }
}

export async function promoteStagingResume(
  stagingUrl: string,
  _filename?: string
): Promise<{ success: boolean; url: string; error?: string }> {
  try {
    // 1. Fetch entire file buffer from validated staging blob
    const res = await fetch(stagingUrl);
    if (!res.ok) {
      throw new Error(`Failed to download staged blob (${res.status})`);
    }
    const buffer = await res.arrayBuffer();

    // 2. Overwrite active resume path with addRandomSuffix: false
    const activeBlob = await put(ACTIVE_RESUME_PATHNAME, buffer, {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'application/pdf',
      cacheControlMaxAge: 60,
    });

    // 3. Delete staging blob cleanly
    try {
      await del(stagingUrl);
    } catch (delErr) {
      console.warn('Failed to delete staging blob after promotion:', delErr);
    }

    return { success: true, url: activeBlob.url };
  } catch (err: unknown) {
    return { success: false, url: '', error: err instanceof Error ? err.message : 'Promotion failed.' };
  }
}

export async function deleteActiveResume(): Promise<boolean> {
  if (!hasBlobConfig()) return false;
  try {
    await del(ACTIVE_RESUME_PATHNAME);
    return true;
  } catch {
    return false;
  }
}
