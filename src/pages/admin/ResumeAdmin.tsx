import React, { useState, useEffect, useRef, useCallback } from 'react';
import { upload } from '@vercel/blob/client';
import {
  FileText,
  Upload,
  RefreshCw,
  LogOut,
  ExternalLink,
  Download,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Eye,
  Trash2,
  X,
  FileCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface ResumeData {
  url: string;
  downloadUrl?: string;
  filename: string;
  size: number | null;
  uploadedAt: string | null;
  exists: boolean;
  isFallback?: boolean;
}

export default function ResumeAdmin() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string>('');

  // Resume state
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [isLoadingResume, setIsLoadingResume] = useState(false);

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceDialogRef = useRef<HTMLDivElement>(null);

  // Check auth on load
  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      });
      if (res.ok) {
        const data = await res.json();
        setIsAuthenticated(true);
        if (data.csrfToken) setCsrfToken(data.csrfToken);
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    }
  }, []);

  // Fetch resume info
  const fetchResumeInfo = useCallback(async () => {
    try {
      setIsLoadingResume(true);
      const res = await fetch('/api/resume', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setResumeData(data);
      }
    } catch (e) {
      console.error('Failed to fetch resume status', e);
    } finally {
      setIsLoadingResume(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
    fetchResumeInfo();
  }, [checkAuth, fetchResumeInfo]);

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials');
      }

      setIsAuthenticated(true);
      if (data.csrfToken) setCsrfToken(data.csrfToken);
      setPassword('');
      fetchResumeInfo();
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-Token': csrfToken,
        },
      });
    } catch {
      // ignore
    }
    setIsAuthenticated(false);
    setSelectedFile(null);
    setUploadProgress(null);
  };

  // Validate file
  const validateFile = (file: File): string | null => {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      return 'Only PDF files are supported.';
    }
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return `File exceeds maximum allowed size of 10MB (${(file.size / (1024 * 1024)).toFixed(2)}MB).`;
    }
    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadStatus(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const errorMsg = validateFile(file);
      if (errorMsg) {
        setUploadStatus({ type: 'error', message: errorMsg });
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      setSelectedFile(file);
      if (resumeData && resumeData.exists && !resumeData.isFallback) {
        setShowReplaceDialog(true);
      } else {
        performUpload(file);
      }
    }
  };

  const performUpload = async (fileToUpload?: File) => {
    const file = fileToUpload || selectedFile;
    if (!file) return;

    setShowReplaceDialog(false);
    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus(null);

    try {
      // 1. Direct-to-blob upload to staging via @vercel/blob/client with public access
      const newBlob = await upload(`staging/${Date.now()}-${file.name}`, file, {
        access: 'public',
        handleUploadUrl: '/api/resume/upload-token',
        clientPayload: JSON.stringify({ filename: file.name }),
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-Token': csrfToken,
        },
        onUploadProgress: (progress) => {
          setUploadProgress(Math.round(progress.percentage));
        },
      });

      // 2. Call server finalize to validate magic bytes, promote to active resume/resume.pdf & delete staging
      const finalizeRes = await fetch('/api/resume/finalize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({
          stagingUrl: newBlob.url,
          filename: file.name,
        }),
      });

      if (!finalizeRes.ok) {
        const errData = await finalizeRes.json().catch(() => ({}));
        throw new Error(errData.error || 'Server validation or promotion failed.');
      }

      setUploadStatus({
        type: 'success',
        message: `Resume "${file.name}" successfully uploaded and activated!`,
      });
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await fetchResumeInfo();
    } catch (err: unknown) {
      console.error('Upload failed', err);
      setUploadStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'Upload failed. The existing resume remains untouched.',
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleDelete = async () => {
    setShowDeleteDialog(false);
    setIsDeleting(true);
    setUploadStatus(null);

    try {
      const res = await fetch('/api/resume', {
        method: 'DELETE',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-Token': csrfToken,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete resume.');
      }

      setUploadStatus({
        type: 'success',
        message: 'Active resume deleted from Vercel Blob. Site has reverted to static fallback.',
      });
      await fetchResumeInfo();
    } catch (err: unknown) {
      setUploadStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'Delete failed.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatBytes = (bytes: number | null): string => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // Loading auth check
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-background text-textMain flex items-center justify-center p-6">
        <div className="flex items-center gap-3 font-mono text-sm text-textMuted">
          <RefreshCw className="animate-spin text-primary" size={18} />
          Verifying security session...
        </div>
      </div>
    );
  }

  // Login view
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background text-textMain flex flex-col justify-center items-center px-4 py-12">
        <div className="w-full max-w-md bg-surface border border-border p-8 rounded-sm shadow-2xl relative">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                <Lock size={20} />
              </div>
              <div>
                <h1 className="font-bold text-lg tracking-tight uppercase">Admin Access</h1>
                <p className="font-mono text-xs text-textMuted">Resume Management Portal</p>
              </div>
            </div>
            <Link to="/" className="text-textMuted hover:text-primary transition-colors text-xs font-mono">
              Back to Site
            </Link>
          </div>

          {loginError && (
            <div
              role="alert"
              aria-live="assertive"
              className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono rounded flex items-center gap-3"
            >
              <AlertTriangle size={16} className="flex-shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="admin-username" className="block text-xs font-mono text-textMuted uppercase tracking-wider mb-2">
                Username
              </label>
              <input
                id="admin-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="UMESH"
                className="w-full px-4 py-3 bg-background border border-border text-textMain font-mono text-sm focus:border-primary focus:outline-none transition-colors"
                required
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-xs font-mono text-textMuted uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-3 bg-background border border-border text-textMain font-mono text-sm focus:border-primary focus:outline-none transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 bg-primary text-background font-mono font-bold text-sm uppercase tracking-wider hover:bg-primaryHover disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw className="animate-spin" size={16} /> Authenticating...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-8 pt-4 border-t border-border/50 text-center">
            <span className="font-mono text-[11px] text-textMuted">
              Protected via Server-Side Scrypt &amp; Signed SameSite HttpOnly Session.
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard view
  return (
    <div className="min-h-screen bg-background text-textMain pt-24 pb-16 px-4 md:px-8 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-8 border-b border-border gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs px-2.5 py-1 bg-primary/10 border border-primary/30 text-primary uppercase tracking-wider rounded">
              Authenticated Admin
            </span>
            <span className="font-mono text-xs text-textMuted">/admin/resume</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight uppercase mt-2">Resume Management</h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/resume"
            target="_blank"
            className="px-4 py-2 border border-border text-textMuted hover:text-textMain hover:border-textMain transition-colors font-mono text-xs uppercase flex items-center gap-2"
          >
            <Eye size={14} /> Public View
          </Link>
          <button
            onClick={handleLogout}
            className="px-4 py-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors font-mono text-xs uppercase flex items-center gap-2 cursor-pointer"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>

      {/* Notifications banner */}
      {uploadStatus && (
        <div
          role="status"
          aria-live="polite"
          className={`mb-8 p-4 border rounded-sm font-mono text-xs flex items-start justify-between gap-3 ${
            uploadStatus.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          <div className="flex items-center gap-3">
            {uploadStatus.type === 'success' ? (
              <CheckCircle2 size={18} className="flex-shrink-0" />
            ) : (
              <AlertTriangle size={18} className="flex-shrink-0" />
            )}
            <span>{uploadStatus.message}</span>
          </div>
          <button onClick={() => setUploadStatus(null)} className="opacity-70 hover:opacity-100">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Actions & Metadata */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Card: Active Resume Status */}
          <div className="bg-surface border border-border p-6 rounded-sm">
            <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
              <span className="font-mono text-xs text-textMuted uppercase tracking-wider flex items-center gap-2">
                <FileCheck size={16} className="text-primary" /> Active Reference
              </span>
              <button
                onClick={fetchResumeInfo}
                disabled={isLoadingResume}
                title="Refresh Status"
                className="text-textMuted hover:text-primary transition-colors disabled:opacity-50"
              >
                <RefreshCw size={14} className={isLoadingResume ? 'animate-spin' : ''} />
              </button>
            </div>

            <div className="space-y-4 text-sm font-mono">
              <div>
                <span className="text-xs text-textMuted block">Filename</span>
                <span className="text-textMain font-semibold break-all">
                  {resumeData?.filename || 'resume.pdf'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-textMuted block">File Size</span>
                  <span className="text-textMain">{formatBytes(resumeData?.size ?? null)}</span>
                </div>
                <div>
                  <span className="text-xs text-textMuted block">Storage Source</span>
                  <span
                    className={`inline-block px-2 py-0.5 text-[10px] uppercase rounded ${
                      resumeData?.isFallback
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {resumeData?.isFallback ? 'Static Fallback' : 'Vercel Blob Active'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs text-textMuted block">Last Updated</span>
                <span className="text-textMain">{formatDate(resumeData?.uploadedAt ?? null)}</span>
              </div>

              <div>
                <span className="text-xs text-textMuted block mb-1">Permanent Public URL</span>
                <a
                  href="/resume.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1.5"
                >
                  {typeof window !== 'undefined' ? `${window.location.origin}/resume.pdf` : '/resume.pdf'} <ExternalLink size={12} />
                </a>
              </div>
            </div>

            {/* Quick action buttons for active resume */}
            {resumeData?.url && (
              <div className="mt-6 pt-4 border-t border-border flex flex-wrap gap-3">
                <a
                  href={resumeData.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 px-3 bg-background border border-border hover:border-primary text-textMain text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                >
                  <ExternalLink size={14} /> Open
                </a>
                <a
                  href={resumeData.downloadUrl || '/api/resume/file?download=1'}
                  download={resumeData.filename || 'resume.pdf'}
                  className="flex-1 py-2.5 px-3 bg-background border border-border hover:border-primary text-textMain text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                >
                  <Download size={14} /> Download
                </a>
                {!resumeData.isFallback && (
                  <button
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={isDeleting || isUploading}
                    className="py-2.5 px-3 border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-mono uppercase transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50"
                    title="Delete Blob Resume & Revert to Fallback"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Card: Upload / Replace Control */}
          <div className="bg-surface border border-border p-6 rounded-sm">
            <span className="font-mono text-xs text-textMuted uppercase tracking-wider block mb-4">
              {resumeData?.isFallback ? 'Upload Active Resume' : 'Replace Active Resume'}
            </span>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              disabled={isUploading}
              className="hidden"
              id="resume-file-input"
            />

            {/* Upload Drag/Click Zone */}
            <label
              htmlFor="resume-file-input"
              className={`border-2 border-dashed rounded-sm p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                isUploading
                  ? 'border-border/40 opacity-50 cursor-not-allowed'
                  : 'border-border hover:border-primary bg-background/50 hover:bg-background'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
                <Upload size={22} />
              </div>
              <span className="font-mono text-sm text-textMain font-medium">
                Tap or click to select PDF
              </span>
              <span className="font-mono text-xs text-textMuted mt-1">
                PDF only • Up to 10MB • Direct Blob Staging
              </span>
            </label>

            {/* Progress indicator */}
            {isUploading && (
              <div className="mt-6 space-y-2">
                <div className="flex justify-between font-mono text-xs text-textMuted">
                  <span>Uploading &amp; Verifying...</span>
                  <span>{uploadProgress !== null ? `${uploadProgress}%` : ''}</span>
                </div>
                <div className="w-full h-2 bg-background border border-border overflow-hidden rounded-full">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${uploadProgress || 10}%` }}
                  />
                </div>
                <p className="font-mono text-[11px] text-textMuted">
                  Two-stage security: staging upload ➔ header verification ➔ promotion.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Inline Live Preview */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="bg-surface border border-border rounded-sm flex flex-col h-full min-h-[550px] lg:min-h-[700px]">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-primary" />
                <span className="font-mono text-xs text-textMain uppercase tracking-wider">
                  Live Active Preview
                </span>
              </div>
              <span className="font-mono text-[11px] text-textMuted">
                {resumeData?.filename || 'resume.pdf'}
              </span>
            </div>

            <div className="relative flex-grow bg-background flex flex-col">
              {resumeData?.url ? (
                <>
                  <iframe
                    src={`${resumeData.url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                    className="w-full flex-grow border-0 rounded-b-sm bg-white min-h-[500px]"
                    title="Active Resume Preview"
                  />
                  {/* Mobile browser fallback note */}
                  <div className="p-3 bg-surface border-t border-border flex items-center justify-between text-xs font-mono text-textMuted">
                    <span>If PDF preview is blank on your phone:</span>
                    <a
                      href={resumeData.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      Open in Browser <ExternalLink size={12} />
                    </a>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center flex-grow p-8 text-center font-mono text-textMuted">
                  <FileText size={48} className="mb-4 opacity-30" />
                  <p>No active resume preview available.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog: Replace Resume */}
      {showReplaceDialog && selectedFile && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="replace-dialog-title"
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
        >
          <div
            ref={replaceDialogRef}
            className="w-full max-w-md bg-surface border border-border p-6 rounded-sm shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-4 text-amber-400">
              <AlertTriangle size={24} />
              <h2 id="replace-dialog-title" className="font-bold text-lg uppercase tracking-tight text-textMain">
                Confirm Replace
              </h2>
            </div>

            <p className="font-mono text-xs text-textMuted mb-4 leading-relaxed">
              You are about to replace your active resume with:
            </p>

            <div className="p-3 bg-background border border-border rounded font-mono text-xs mb-6 space-y-1">
              <div className="text-textMain font-semibold truncate">{selectedFile.name}</div>
              <div className="text-textMuted">Size: {formatBytes(selectedFile.size)}</div>
            </div>

            <p className="font-mono text-[11px] text-textMuted mb-6">
              The existing resume remains untouched until the new file passes magic-byte verification and promotion.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowReplaceDialog(false);
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="px-4 py-2 border border-border text-textMuted hover:text-textMain font-mono text-xs uppercase transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => performUpload()}
                className="px-4 py-2 bg-primary text-background font-mono font-bold text-xs uppercase tracking-wider hover:bg-primaryHover transition-colors cursor-pointer"
              >
                Confirm &amp; Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog: Delete Active Blob */}
      {showDeleteDialog && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
        >
          <div className="w-full max-w-md bg-surface border border-red-500/30 p-6 rounded-sm shadow-2xl">
            <div className="flex items-center gap-3 mb-4 text-red-400">
              <Trash2 size={24} />
              <h2 id="delete-dialog-title" className="font-bold text-lg uppercase tracking-tight text-textMain">
                Delete Blob Resume?
              </h2>
            </div>

            <p className="font-mono text-xs text-textMuted mb-6 leading-relaxed">
              This will remove the uploaded PDF from Vercel Blob storage. Your website will immediately fall back to the built-in static resume (`/Umesh-Temburwar-OCT.pdf`), so no visitors encounter a 404.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteDialog(false)}
                className="px-4 py-2 border border-border text-textMuted hover:text-textMain font-mono text-xs uppercase transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 text-white font-mono font-bold text-xs uppercase tracking-wider hover:bg-red-600 transition-colors cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
