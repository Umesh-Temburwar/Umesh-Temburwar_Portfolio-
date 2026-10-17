import { getActiveResumeStatus, deleteActiveResume } from '../_lib/blob';
import { authenticateRequest, verifyCsrf } from '../_lib/auth';

export default async function handler(req: any, res: any) {
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // GET: Public active resume metadata
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400');
    try {
      const status = await getActiveResumeStatus();
      return res.status(200).json(status);
    } catch (err: unknown) {
      console.error('Failed to get active resume status:', err);
      return res.status(500).json({ error: 'Failed to retrieve resume metadata' });
    }
  }

  // DELETE: Protected active resume deletion (revert to fallback)
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
      await deleteActiveResume();
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
}
