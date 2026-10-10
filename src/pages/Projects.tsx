import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, X, Info } from 'lucide-react';
import { FiGithub } from 'react-icons/fi';
import { portfolioData } from '../data/portfolio';
import { Reveal } from '../components/Reveal';

const SectionHeader = ({ num, title }: { num: string; title: string }) => (
  <div className="col-span-12 flex items-baseline gap-4 mb-8">
    <span className="font-mono text-sm text-primary">{num}</span>
    <h2 className="text-3xl md:text-5xl font-bold tracking-tighter uppercase">{title}</h2>
    <div className="flex-grow h-[1px] bg-border ml-4" />
  </div>
);

export default function Projects() {
  const [selectedProject, setSelectedProject] = useState<typeof portfolioData.projects[0] | null>(null);

  return (
    <div className="pt-32 px-6 max-w-7xl mx-auto min-h-screen text-textMain">
      <SectionHeader num="02 /" title="Projects" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 mt-8">
        {portfolioData.projects.map((project, idx) => (
          <Reveal
            key={project.id}
            delay={Math.min(idx * 80, 480)}
            className="group border border-border bg-surface overflow-hidden flex flex-col h-full hover:border-primary/50 transition-colors"
          >
            <div className="w-full h-64 overflow-hidden relative cursor-pointer" onClick={() => setSelectedProject(project)}>
              <img src={project.coverImage} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors duration-500" />
            </div>
            <div className="p-8 flex flex-col flex-grow">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl font-bold cursor-pointer hover:text-primary transition-colors" onClick={() => setSelectedProject(project)}>{project.title}</h3>
                <span className="font-mono text-xs text-primary px-3 py-1 border border-primary/30 rounded-full shrink-0">{project.status}</span>
              </div>
              <p className="text-textMuted leading-relaxed mb-6 flex-grow">{project.shortDescription}</p>
              <div className="flex flex-wrap gap-2 mb-8 mt-auto">
                {project.tech.slice(0, 4).map(t => (
                  <span key={t} className="font-mono text-xs text-textMuted bg-background border border-border px-2 py-1">{t}</span>
                ))}
                {project.tech.length > 4 && <span className="font-mono text-xs text-textMuted bg-background border border-border px-2 py-1">+{project.tech.length - 4}</span>}
              </div>
              <div className="flex flex-wrap gap-4 items-center">
                <button onClick={() => setSelectedProject(project)} className="text-sm font-mono text-textMain border-b border-textMain hover:border-primary hover:text-primary transition-colors pb-1 flex items-center gap-1">
                  <Info size={12} /> VIEW DETAILS
                </button>
                {project.githubUrl && (
                  <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-mono text-textMain border-b border-textMain hover:border-primary hover:text-primary transition-colors pb-1 flex items-center gap-1">
                    <FiGithub size={12} /> GITHUB
                  </a>
                )}
                {project.liveUrl && (
                  <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-mono text-textMain border-b border-textMain hover:border-primary hover:text-primary transition-colors pb-1 flex items-center gap-1">
                    <ExternalLink size={12} /> VIEW PROJECT
                  </a>
                )}
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      <AnimatePresence>
        {selectedProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 bg-background/80 backdrop-blur-sm"
            onClick={() => setSelectedProject(null)}
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-4xl max-h-[90vh] bg-surface border border-border overflow-y-auto flex flex-col relative"
            >
              <button
                onClick={() => setSelectedProject(null)}
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center text-textMain hover:text-primary transition-colors"
              >
                <X size={20} />
              </button>

              <div className="w-full h-[40vh] min-h-[300px] relative overflow-hidden bg-background">
                <img src={selectedProject.coverImage} alt={selectedProject.title} className="w-full h-full object-cover opacity-60" />
                <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent" />
                <div className="absolute bottom-0 left-0 p-8 md:p-12">
                  <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tighter uppercase">{selectedProject.title}</h2>
                  <div className="flex flex-wrap gap-3">
                    {selectedProject.tech.map(t => (
                      <span key={t} className="font-mono text-xs text-textMain bg-background/50 backdrop-blur-md border border-border px-3 py-1.5">{t}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-8 md:p-12 flex flex-col gap-12">
                <div className="grid grid-cols-1 gap-8">
                  <div className="md:col-span-2">
                    <h3 className="text-sm font-mono text-primary uppercase tracking-widest mb-4">Overview</h3>
                    <p className="text-textMuted text-lg leading-relaxed">{selectedProject.description || selectedProject.shortDescription}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-border/50">
                  {selectedProject.liveUrl && (
                    <a href={selectedProject.liveUrl} target="_blank" rel="noopener noreferrer" className="px-8 py-4 bg-textMain text-background hover:bg-primary transition-colors font-mono text-sm uppercase tracking-widest flex items-center justify-center gap-2">
                      Live Project <ExternalLink size={16} />
                    </a>
                  )}
                  {selectedProject.githubUrl && (
                    <a href={selectedProject.githubUrl} target="_blank" rel="noopener noreferrer" className="px-8 py-4 border border-border hover:border-primary transition-colors font-mono text-sm uppercase tracking-widest flex items-center justify-center gap-2">
                      View Code <FiGithub size={16} />
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
