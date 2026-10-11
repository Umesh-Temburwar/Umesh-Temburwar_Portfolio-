import { portfolioData } from '../data/portfolio';

export default function Resume() {
  return (
    <div className="pt-32 pb-12 px-6 w-full h-[calc(100vh-80px)] min-h-screen flex flex-col items-center justify-center bg-background text-textMain">
      {!portfolioData.resume.exists ? (
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <h2 className="text-3xl font-bold tracking-tighter uppercase">Resume</h2>
          <p className="font-mono text-sm text-textMuted text-center max-w-md">
            Resume PDF is currently unavailable. Please check back later.
          </p>
        </div>
      ) : (
        <div className="w-full max-w-[850px] h-full shadow-2xl relative flex-grow flex flex-col">
          <iframe
            src={`${portfolioData.resume.pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
            className="w-full h-full border-none bg-white rounded-sm flex-grow"
            title="Resume"
          />
          <div className="absolute -bottom-16 w-full flex justify-center">
            <a href={portfolioData.resume.pdfUrl} download className="px-6 py-3 border border-border text-textMain hover:border-primary hover:text-primary transition-colors font-mono text-sm uppercase tracking-widest flex items-center gap-2 bg-background">
              Download PDF
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
