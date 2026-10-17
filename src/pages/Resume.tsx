import { useResume } from '../hooks/useResume';

export default function Resume() {
  const { url, filename, exists, isLoading } = useResume();

  return (
    <div className="pt-32 pb-16 px-4 md:px-6 w-full h-[calc(100vh-80px)] min-h-screen flex flex-col items-center justify-center bg-background text-textMain">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="font-mono text-sm text-textMuted">Loading resume...</p>
        </div>
      ) : !exists || !url ? (
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <h2 className="text-3xl font-bold tracking-tighter uppercase">Resume</h2>
          <p className="font-mono text-sm text-textMuted text-center max-w-md">
            Resume PDF is currently unavailable. Please check back later.
          </p>
        </div>
      ) : (
        <div className="w-full max-w-[850px] h-full shadow-2xl relative flex-grow flex flex-col">
          <iframe
            src={`${url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
            className="w-full h-full border-none bg-white rounded-sm flex-grow"
            title="Resume"
          />
          <div className="absolute -bottom-16 w-full flex justify-center">
            <a
              href={url}
              download={filename || 'resume.pdf'}
              className="px-6 py-3 border border-border text-textMain hover:border-primary hover:text-primary transition-colors font-mono text-sm uppercase tracking-widest flex items-center gap-2 bg-background"
            >
              Download PDF
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
