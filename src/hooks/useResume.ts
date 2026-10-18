import { useState, useEffect, useCallback } from 'react';
import { portfolioData } from '../data/portfolio';

export interface ResumeMetadata {
  url: string;
  downloadUrl?: string;
  filename: string;
  size: number | null;
  uploadedAt: string | null;
  exists: boolean;
  isFallback?: boolean;
}

const DEFAULT_RESUME: ResumeMetadata = {
  url: portfolioData.resume.pdfUrl || '/Umesh-Temburwar-OCT.pdf',
  downloadUrl: portfolioData.resume.pdfUrl || '/Umesh-Temburwar-OCT.pdf',
  filename: 'Umesh-Temburwar-OCT.pdf',
  size: null,
  uploadedAt: null,
  exists: true,
  isFallback: true,
};

export function useResume() {
  const [resume, setResume] = useState<ResumeMetadata>(DEFAULT_RESUME);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResume = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/resume', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`Failed to fetch resume status: ${res.status}`);
      }
      const data = await res.json();
      if (data && data.url) {
        setResume({
          url: data.url,
          downloadUrl: data.downloadUrl || data.url,
          filename: data.filename || 'resume.pdf',
          size: typeof data.size === 'number' ? data.size : null,
          uploadedAt: data.uploadedAt || null,
          exists: data.exists !== false,
          isFallback: Boolean(data.isFallback),
        });
      } else {
        setResume(DEFAULT_RESUME);
      }
    } catch (err: unknown) {
      // Degrade gracefully to static local resume fallback
      setResume(DEFAULT_RESUME);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResume();
  }, [fetchResume]);

  return {
    ...resume,
    isLoading,
    error,
    refresh: fetchResume,
  };
}
