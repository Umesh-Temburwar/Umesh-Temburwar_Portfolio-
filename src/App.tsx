import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion, useScroll, useTransform, useMotionValue, useAnimationFrame, useMotionValueEvent, LayoutGroup } from 'framer-motion';
import { ArrowUp, ArrowRight, ExternalLink, X, Mail, Send } from 'lucide-react';
import { IconLinkedin as Linkedin, IconInstagram as Instagram } from '@/components/icons/BrandIcons';
import { useLocation, Link } from 'react-router-dom';

import emailjs from '@emailjs/browser';
import { portfolioData } from './data/portfolio';
import { Reveal } from '@/components/Reveal';
import { SocialLinks } from '@/components/SocialLinks';

import GatewayFlow from '@/components/ui/gateway-flow';



// --- CUSTOM CURSOR ---
const CustomCursor = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion || window.matchMedia('(pointer: coarse)').matches) return;

    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName.toLowerCase() === 'a' || target.tagName.toLowerCase() === 'button' || target.closest('a') || target.closest('button')) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener('mousemove', updateMousePosition);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, [shouldReduceMotion]);

  if (shouldReduceMotion || typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) return null;

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 w-2 h-2 bg-primary rounded-full pointer-events-none z-[100] mix-blend-difference"
        animate={{ x: mousePosition.x - 4, y: mousePosition.y - 4 }}
        transition={{ type: 'tween', ease: 'backOut', duration: 0.1 }}
      />
      <motion.div
        className="fixed top-0 left-0 w-8 h-8 border border-primary/50 rounded-full pointer-events-none z-[99]"
        animate={{
          x: mousePosition.x - 16,
          y: mousePosition.y - 16,
          scale: isHovering ? 1.5 : 1,
          backgroundColor: isHovering ? 'rgba(245, 165, 36, 0.1)' : 'transparent'
        }}
        transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.5 }}
      />
    </>
  );
};

// --- ICONS ---
const Github = ({ size = 24, className = '', ...props }: React.SVGProps<SVGSVGElement> & { size?: number | string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props} aria-hidden="true">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3-.3 6-1.5 6-6.5a5.5 5.5 0 0 0-1.5-3.8 5.5 5.5 0 0 0-.1-3.8s-1.2-.4-3.9 1.4a13.4 13.4 0 0 0-7 0C6.2 2.7 5 3.1 5 3.1a5.5 5.5 0 0 0-.1 3.8A5.5 5.5 0 0 0 3 10.7c0 5 3 6.2 6 6.5a4.8 4.8 0 0 0-1 3.2v4"></path>
  </svg>
);



// --- HOOKS ---
// Scroll spy hook removed

// --- MARQUEE ---
const Marquee = ({ items }: { items: string[] }) => {
  const shouldReduceMotion = useReducedMotion();
  const baseX = useMotionValue(0);
  const x = useTransform(baseX, (v: number) => `${v}%`);

  useAnimationFrame((_t, delta) => {
    if (shouldReduceMotion) return;
    const moveBy = 0.003 * delta;
    let newX = baseX.get() - moveBy;
    if (newX <= -50) newX += 50;
    baseX.set(newX);
  });

  return (
    <div className="py-8 border-y border-border overflow-hidden bg-surface/30 flex whitespace-nowrap">
      <motion.div className="flex gap-12 items-center" style={{ x }}>
        {[...items, ...items, ...items, ...items].map((item, i) => (
          <span key={i} className="text-xl font-mono text-textMuted uppercase tracking-widest">{item}</span>
        ))}
      </motion.div>
    </div>
  );
};

// --- COMPONENTS ---
const SectionHeader = ({ num, title }: { num: string, title: string }) => (
  <div className="col-span-12 md:col-span-12 mb-16 flex items-baseline gap-4 border-b border-border pb-6">
    <span className="font-mono text-primary text-sm">{num}</span>
    <h2 className="text-4xl md:text-5xl font-bold tracking-tight uppercase">{title}</h2>
  </div>
);

const NavBar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { scrollY } = useScroll();
  const location = useLocation();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const scrolled = latest > (typeof window !== 'undefined' ? window.innerHeight * 0.4 : 300);
    if (scrolled !== isScrolled) setIsScrolled(scrolled);
  });

  return (
    <nav className={`fixed w-full top-0 z-50 p-4 md:p-6 flex justify-between items-center transition-all duration-300 ${isScrolled ? 'bg-surface/95 backdrop-blur-md border-b border-border shadow-sm' : 'bg-transparent'}`}>
      <div className="flex items-center gap-4 relative min-w-[200px] h-10">
        <Link to="/" className="flex items-center gap-3 w-max z-10 group cursor-pointer">
          <div className="w-10 h-10 flex-shrink-0 overflow-hidden rounded-full border border-border group-hover:border-primary group-hover:shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)] transition-all duration-300 flex items-center justify-center bg-surface">
            {portfolioData.hero.profilePhoto && !imageError ? (
              <img
                src={portfolioData.hero.profilePhoto}
                alt={portfolioData.hero.name}
                className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-300"
                onError={() => setImageError(true)}
              />
            ) : (
              <span className="font-bold text-sm text-textMuted group-hover:text-primary transition-colors">UT</span>
            )}
          </div>
          <div className="flex flex-col group-hover:opacity-80 transition-opacity">
            <span className="font-bold text-sm leading-tight whitespace-nowrap">{portfolioData.hero.name}</span>
            <span className="text-[10px] font-mono text-primary whitespace-nowrap">
              {portfolioData.hero.title.split('|')[0].trim() || 'Developer'}
            </span>
          </div>
        </Link>
      </div>

      <div className="hidden md:flex items-center gap-6">
        {portfolioData.header.navLinks.map((link) => {
          const isActive = location.pathname === link.href;
          return (
            <Link
              key={link.name}
              to={link.href}
              className={`relative font-mono text-sm transition-colors py-2 ${isActive ? 'text-primary' : 'text-textMuted hover:text-textMain'}`}
            >
              {link.name}
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>

      <a href="#contact" className="md:hidden font-mono text-xs text-textMain border border-border px-3 py-1.5 hover:text-primary transition-colors">Get in touch</a>
    </nav>
  );
};

const HeroVisual = ({ isLoaded }: { isLoaded: boolean }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const scrolled = latest > (typeof window !== 'undefined' ? window.innerHeight * 0.4 : 300);
    if (scrolled !== isScrolled) setIsScrolled(scrolled);
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={isLoaded ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
      transition={{ duration: 1, delay: 0.2 }}
      className="w-full aspect-[4/5] border border-border p-2 bg-surface/50 relative group"
    >
      <div className="w-full h-full bg-surface relative z-10 overflow-hidden">
        {portfolioData.hero.profilePhoto && !imageError ? (
          <img
            src={portfolioData.hero.profilePhoto}
            alt={portfolioData.hero.name}
            className="w-full h-full object-cover object-center"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center font-mono text-sm text-textMuted bg-surface border border-border">UT</div>
        )}
      </div>
    </motion.div>
  );
};

const App = () => {
  const shouldReduceMotion = useReducedMotion();
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedProject, setSelectedProject] = useState<typeof portfolioData.projects[0] | null>(null);

  // Scroll spy unused since routing migration


  const location = useLocation();
  const showProjects = location.pathname === '/projects';
  const showContact = location.pathname === '/contact';
  const showResume = location.pathname === '/resume';
  const showHomeContent = location.pathname === '/' || location.pathname === '/about' || location.pathname === '/skills' || location.pathname === '/experience' || location.pathname === '/education' || location.pathname === '/certifications';

  useEffect(() => {
    if (location.hash) {
      setTimeout(() => {
        const element = document.getElementById(location.hash.substring(1));
        if (element) element.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [location]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const formRef = useRef<HTMLFormElement>(null);

  const sendEmail = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting || !formRef.current) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');

    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    if (!serviceId || !templateId || !publicKey) {
      if (import.meta.env.DEV) {
        console.error("[EmailJS Diagnostics] Missing credentials:", {
          hasServiceId: !!serviceId,
          hasTemplateId: !!templateId,
          hasPublicKey: !!publicKey
        });
      }
      setSubmitStatus('error');
      setIsSubmitting(false);
      return;
    }

    emailjs.sendForm(serviceId, templateId, formRef.current, {
      publicKey: publicKey,
    })
      .then((response) => {
        if (import.meta.env.DEV) {
          console.info("[EmailJS Diagnostics] Delivery success:", response.status, response.text);
        }
        setSubmitStatus('success');
        formRef.current?.reset();
      })
      .catch((error: unknown) => {
        if (import.meta.env.DEV) {
          const errObj = error as { status?: number; text?: string };
          console.error("[EmailJS Diagnostics] Delivery failed:", errObj?.status, errObj?.text || error);
        }
        setSubmitStatus('error');
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const progressBarRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const heroVisualRef = useRef<HTMLDivElement>(null);

  const experienceRef = useRef<HTMLElement>(null);
  const educationRef = useRef<HTMLElement>(null);
  const { scrollYProgress: expScrollY } = useScroll({ target: experienceRef, offset: ["start center", "end center"] });
  const { scrollYProgress: eduScrollY } = useScroll({ target: educationRef, offset: ["start center", "end center"] });

  useEffect(() => {
    document.documentElement.classList.add('js-ready');
    return () => document.documentElement.classList.remove('js-ready');
  }, []);

  useEffect(() => {
    if (shouldReduceMotion) {
      setIsLoaded(true);
      return;
    }

    // Shared rAF scroll loop for progress bar and parallax
    let ticking = false;

    const updateScroll = () => {
      const y = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? y / maxScroll : 0;

      if (progressBarRef.current) {
        progressBarRef.current.style.transform = `scaleX(${progress})`;
      }

      // Parallax
      if (heroRef.current && heroVisualRef.current && window.innerWidth >= 768) {
        const heroHeight = heroRef.current.offsetHeight;
        if (y < heroHeight) {
          const parallaxOffset = (y / heroHeight) * 40;
          heroVisualRef.current.style.transform = `translate3d(0, ${parallaxOffset}px, 0)`;
        }
      }
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking && document.visibilityState !== 'hidden') {
        requestAnimationFrame(updateScroll);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    updateScroll();

    // Initial load animation timer
    const timer = setTimeout(() => setIsLoaded(true), 1500);

    return () => {
      window.removeEventListener('scroll', onScroll);
      clearTimeout(timer);
    };
  }, [shouldReduceMotion]);

  useEffect(() => {
    document.body.style.overflow = selectedProject ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [selectedProject]);

  const allTech = portfolioData.projects.flatMap(p => p.tech).filter((v, i, a) => a.indexOf(v) === i);

  return (
    <LayoutGroup>
      <div className="relative min-h-screen text-textMain selection:bg-primary/20 selection:text-primary z-0">
        <GatewayFlow speed={0.8} opacity={0.4} />
        <CustomCursor />

        {/* Page Load Intro overlay rendered conditionally but returning main app always */}
        <AnimatePresence>
          {!isLoaded && !shouldReduceMotion && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="fixed inset-0 bg-background z-[200] flex items-center justify-center pointer-events-none"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="text-4xl font-bold tracking-tighter"
              >
                {portfolioData.header.logo}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scroll Progress Bar */}
        <div
          ref={progressBarRef}
          className="fixed top-0 left-0 right-0 h-[2px] bg-primary origin-left z-[100]"
          style={{ transform: 'scaleX(0)' }}
          aria-hidden="true"
        />

        <NavBar />

        <main>
          {showHomeContent && (
            <>
              {/* HERO SECTION */}
              <section id="hero" ref={heroRef} className="min-h-screen relative flex flex-col justify-center px-6 pt-24 pb-12 max-w-[1920px] mx-auto overflow-hidden">
                {/* Subtle radial vignette */}
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />

                <div
                  ref={heroVisualRef}
                  className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-12 relative z-10 items-center"
                >

                  {/* Left Column: Text & CTAs */}
                  <div className="lg:col-span-7 flex flex-col min-w-0">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={isLoaded ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className="font-mono text-primary mb-6"
                    >
                      Open to software engineering roles
                    </motion.div>

                    <div className="overflow-hidden mb-2">
                      <motion.h1
                        initial={{ y: "100%" }}
                        animate={isLoaded ? { y: 0 } : { y: "100%" }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                        className="font-bold leading-[0.95] tracking-tighter uppercase break-normal min-w-0"
                        style={{ fontSize: "clamp(2.5rem, 6.5vw, 6.5rem)" }}
                      >
                        {portfolioData.hero.name.split(' ')[0]}
                      </motion.h1>
                    </div>
                    <div className="overflow-hidden mb-8 flex gap-4">
                      <motion.h1
                        initial={{ y: "100%" }}
                        animate={isLoaded ? { y: 0 } : { y: "100%" }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
                        className="font-bold leading-[0.95] tracking-tighter uppercase text-textMuted break-normal min-w-0"
                        style={{ fontSize: "clamp(2.5rem, 6.5vw, 6.5rem)" }}
                      >
                        {portfolioData.hero.name.split(' ').slice(1).join(' ')}
                      </motion.h1>
                    </div>

                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={isLoaded ? { opacity: 1 } : { opacity: 0 }}
                      transition={{ duration: 0.8, delay: 0.6 }}
                      className="text-xl md:text-2xl max-w-2xl text-textMuted mb-12 leading-relaxed"
                    >
                      I build full-stack web applications using React, Node.js and TypeScript, with a focus on scalable architecture and clean interfaces.
                    </motion.p>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={isLoaded ? { opacity: 1 } : { opacity: 0 }}
                      transition={{ duration: 0.8, delay: 0.8 }}
                      className="flex flex-col sm:flex-row gap-6 w-full"
                    >
                      <Link to="/projects" className="px-8 py-4 bg-textMain text-background font-medium hover:bg-primary transition-colors flex items-center justify-center gap-2">
                        View Projects <ArrowRight size={18} />
                      </Link>
                      {portfolioData.resume.exists ? (
                        <Link to="/resume" className="px-8 py-4 border border-border hover:border-primary text-textMain transition-colors flex items-center justify-center gap-2">
                          View CV
                        </Link>
                      ) : (
                        <span className="px-8 py-4 border border-border text-textMuted flex items-center justify-center gap-2 opacity-50 cursor-not-allowed">
                          CV coming soon
                        </span>
                      )}
                    </motion.div>

                    <SocialLinks className="mt-6 md:mt-8" />
                  </div>

                  {/* Right Column: Visual Cluster */}
                  <div className="lg:col-span-5 flex justify-center lg:justify-end mt-12 lg:mt-0">
                    <div className="w-full max-w-[320px] md:max-w-[420px] lg:max-w-full relative">
                      <HeroVisual isLoaded={isLoaded} />
                    </div>
                  </div>
                </div>
              </section>

              <Marquee items={allTech} />

              {/* ABOUT SECTION */}
              <section id="about" className="py-32 px-6 max-w-7xl mx-auto scroll-mt-24">
                <div className="grid grid-cols-12 gap-6">
                  <SectionHeader num="01 /" title="About Me" />

                  <Reveal delay={0} className="col-span-12 lg:col-span-8 pr-0 lg:pr-12">
                    <h3 className="text-2xl md:text-3xl leading-relaxed text-textMuted mb-8">
                      {portfolioData.about.content}
                    </h3>
                  </Reveal>

                  <Reveal delay={200} className="col-span-12 lg:col-span-4 flex flex-col gap-8 font-mono text-sm border-l-0 lg:border-l border-border pl-0 lg:pl-12 mt-8 lg:mt-0">
                    <div>
                      <span className="text-textMuted block mb-2">Location</span>
                      <span className="text-textMain">{portfolioData.experience[0]?.location || "Maharashtra, India"}</span>
                    </div>
                    <div>
                      <span className="text-textMuted block mb-2">Education</span>
                      <span className="text-textMain">{portfolioData.education[0]?.degree}</span>
                    </div>
                    <Reveal delay={400}>
                      <span className="text-textMuted block mb-2">Focus</span>
                      <span className="text-textMain">Full-Stack Development</span>
                    </Reveal>
                  </Reveal>
                </div>
              </section>

            </>
          )}

          {/* PROJECTS SECTION */}
          {showProjects && (
            <section id="projects" className="py-32 px-6 max-w-7xl mx-auto scroll-mt-24">
              <div className="grid grid-cols-12 gap-6">
                <SectionHeader num="02 /" title="Projects" />
                <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 mt-8">
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
                        <div className="flex gap-4">
                          <button onClick={() => setSelectedProject(project)} className="text-sm font-mono text-textMain border-b border-textMain hover:border-primary hover:text-primary transition-colors pb-1">
                            VIEW DETAILS
                          </button>
                        </div>
                      </div>
                    </Reveal>
                  ))}
                </div>
              </div>
            </section>
          )}

          {showHomeContent && (
            <>
              {/* SKILLS SECTION */}
              <section id="skills" className="py-32 px-6 max-w-7xl mx-auto scroll-mt-24">
                <div className="grid grid-cols-12 gap-6">
                  <SectionHeader num="03 /" title="SKILLS" />

                  <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {portfolioData.skills.core.map((group, idx) => (
                      <Reveal
                        key={idx}
                        delay={Math.min(idx * 80, 480)}
                        className="p-8 border border-border bg-surface hover:border-border/80 transition-colors"
                      >
                        <h3 className="font-mono text-sm text-primary mb-6 uppercase tracking-widest">{group.category}</h3>
                        <div className="flex flex-wrap gap-2">
                          {group.items.map(item => (
                            <span key={item} className="px-3 py-1 bg-background border border-border font-mono text-xs text-textMuted hover:text-textMain hover:border-primary/50 transition-colors cursor-default">
                              {item}
                            </span>
                          ))}
                        </div>
                      </Reveal>
                    ))}
                  </div>
                </div>
              </section>

              {/* EXPERIENCE & EDUCATION SECTION */}
              <section id="experience" ref={experienceRef} className="py-32 px-6 max-w-7xl mx-auto scroll-mt-24">
                <div className="grid grid-cols-12 gap-6">
                  <SectionHeader num="04 /" title="Experience" />

                  <div className="col-span-12 lg:col-span-10 lg:col-start-2 relative">
                    {/* Timeline line drawing on scroll */}
                    <div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2" />
                    <motion.div
                      className="absolute left-0 md:left-1/2 top-0 bottom-0 w-px bg-primary -translate-x-1/2 origin-top"
                      style={{ scaleY: expScrollY }}
                    />

                    <div className="space-y-24">
                      {/* Experience Map */}
                      {portfolioData.experience.map((exp, idx) => (
                        <Reveal
                          key={idx}
                          delay={Math.min(idx * 80, 480)}
                          className="relative flex flex-col md:flex-row items-start justify-between w-full"
                        >
                          {/* Timeline Node */}
                          <div className="absolute left-0 md:left-1/2 top-0 w-3 h-3 bg-background border-2 border-primary rounded-full -translate-x-1/2 mt-2 z-10" />

                          <div className="w-full md:w-[45%] pl-8 md:pl-0 md:pr-12 text-left md:text-right mb-4 md:mb-0">
                            <h3 className="text-2xl font-bold mb-2">{exp.role}</h3>
                            <div className="font-mono text-sm text-textMuted flex md:justify-end items-center gap-4">
                              <span>{exp.company}</span>
                              <span className="hidden md:inline">•</span>
                              <span>{exp.duration}</span>
                            </div>
                          </div>

                          <div className="w-full md:w-[45%] pl-8 md:pl-12">
                            <ul className="space-y-3">
                              {exp.highlights.map((h, i) => (
                                <li key={i} className="text-textMuted leading-relaxed">
                                  {h}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </Reveal>
                      ))}

                    </div>
                  </div>
                </div>
              </section>

              {/* EDUCATION SECTION */}
              <section id="education" ref={educationRef} className="py-32 px-6 max-w-7xl mx-auto scroll-mt-24">
                <div className="grid grid-cols-12 gap-6">
                  <SectionHeader num="05 /" title="Education" />

                  <div className="col-span-12 lg:col-span-10 lg:col-start-2 relative">
                    <div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2" />
                    <motion.div
                      className="absolute left-0 md:left-1/2 top-0 bottom-0 w-px bg-primary -translate-x-1/2 origin-top"
                      style={{ scaleY: eduScrollY }}
                    />

                    <div className="space-y-24">
                      {portfolioData.education.map((edu, idx) => (
                        <Reveal
                          key={`edu-${idx}`}
                          delay={Math.min(idx * 80, 480)}
                          className="relative flex flex-col md:flex-row items-start justify-between w-full"
                        >
                          <div className="absolute left-0 md:left-1/2 top-0 w-3 h-3 bg-background border-2 border-primary rounded-full -translate-x-1/2 mt-2 z-10" />

                          <div className="w-full md:w-[45%] pl-8 md:pl-0 md:pr-12 text-left md:text-right mb-4 md:mb-0">
                            <h3 className="text-2xl font-bold mb-2">{edu.degree}</h3>
                            <div className="font-mono text-sm text-textMuted flex md:justify-end items-center gap-4">
                              <span>{edu.institution}</span>
                              <span className="hidden md:inline">•</span>
                              <span>{edu.duration}</span>
                            </div>
                          </div>
                        </Reveal>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* CERTIFICATIONS SECTION */}
              <section id="certifications" className="py-32 px-6 max-w-7xl mx-auto border-t border-border scroll-mt-24">
                <div className="grid grid-cols-12 gap-6">
                  <SectionHeader num="06 /" title="Certifications" />

                  <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                    {portfolioData.certifications.length > 0 ? (
                      portfolioData.certifications.map((cert, idx) => (
                        <Reveal
                          key={idx}
                          delay={Math.min(idx * 80, 480)}
                          className="border border-border bg-surface overflow-hidden flex flex-col group hover:border-primary/50 transition-colors"
                        >
                          {cert.image && (
                            <div className="w-full h-48 overflow-hidden bg-background">
                              <img src={cert.image} alt={cert.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80 group-hover:opacity-100" />
                            </div>
                          )}
                          <div className="p-6 flex flex-col flex-grow">
                            <h4 className="font-bold text-lg leading-tight mb-2">{cert.title}</h4>
                            <div className="font-mono text-sm text-textMuted mb-6 flex-grow">{cert.issuer} • {cert.date}</div>
                            {cert.link && (
                              <a href={cert.link} target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-primary flex items-center gap-2 hover:underline w-fit">
                                VERIFY CREDENTIAL <ExternalLink size={12} />
                              </a>
                            )}
                          </div>
                        </Reveal>
                      ))
                    ) : (
                      <div className="col-span-12 py-12 flex justify-center text-textMuted font-mono text-sm bg-surface/30">
                        No active certifications to display.
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </>
          )}

          {/* RESUME SECTION */}
          {showResume && portfolioData.resume.exists && (
            <section id="resume" className="w-full h-screen pt-[100px] pb-12 flex flex-col items-center justify-center bg-background">
              <div className="w-full max-w-[850px] h-full shadow-2xl relative">
                <iframe
                  src={`${portfolioData.resume.pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                  className="w-full h-full border-none bg-white rounded-sm"
                  title="Resume"
                />
                <div className="absolute -bottom-16 w-full flex justify-center">
                  <a href={portfolioData.resume.pdfUrl} download className="px-6 py-3 border border-border text-textMain hover:border-primary hover:text-primary transition-colors font-mono text-sm uppercase tracking-widest flex items-center gap-2">
                    Download PDF
                  </a>
                </div>
              </div>
            </section>
          )}

          {/* CONTACT SECTION */}
          {showContact && (
            <section id="contact" className="py-32 px-6 max-w-7xl mx-auto border-t border-border scroll-mt-24">
              <div className="grid grid-cols-12 gap-6">
                <Reveal className="col-span-12 mb-16">
                  <h2 className="text-[clamp(3rem,8vw,6rem)] font-bold tracking-tighter uppercase leading-none">
                    Let's Work <br /><span className="text-primary">Together.</span>
                  </h2>
                </Reveal>
                <Reveal delay={200} className="col-span-12 lg:col-span-5 mb-12 lg:mb-0">
                  <h3 className="text-3xl font-bold mb-4 uppercase tracking-tighter">Let's Connect</h3>
                  <p className="text-xl text-textMuted mb-12">
                    Find me on these platforms or reach out directly
                  </p>

                  <div className="flex flex-col gap-6">
                    <a href="https://github.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-6 group">
                      <div className="w-14 h-14 border border-border flex items-center justify-center group-hover:border-primary group-hover:text-primary transition-colors">
                        <Github size={24} />
                      </div>
                      <div>
                        <div className="font-bold text-lg group-hover:text-primary transition-colors">GitHub</div>
                        <div className="text-textMuted font-mono text-sm">Check out my code and projects</div>
                      </div>
                    </a>

                    <a href="https://www.linkedin.com/in/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-6 group">
                      <div className="w-14 h-14 border border-border flex items-center justify-center group-hover:border-primary group-hover:text-primary transition-colors">
                        <Linkedin className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-bold text-lg group-hover:text-primary transition-colors">LinkedIn</div>
                        <div className="text-textMuted font-mono text-sm">Connect with me professionally</div>
                      </div>
                    </a>

                    <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-6 group">
                      <div className="w-14 h-14 border border-border flex items-center justify-center group-hover:border-primary group-hover:text-primary transition-colors">
                        <Instagram className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-bold text-lg group-hover:text-primary transition-colors">Instagram</div>
                        <div className="text-textMuted font-mono text-sm">Follow me for updates and behind-the-scenes</div>
                      </div>
                    </a>

                    <a href="mailto:umeshtemburwar2002@gmail.com" className="flex items-center gap-6 group">
                      <div className="w-14 h-14 border border-border flex items-center justify-center group-hover:border-primary group-hover:text-primary transition-colors">
                        <Mail size={24} />
                      </div>
                      <div>
                        <div className="font-bold text-lg group-hover:text-primary transition-colors">Email</div>
                        <div className="text-textMuted font-mono text-sm">Send me a direct email</div>
                      </div>
                    </a>
                  </div>
                </Reveal>
                <Reveal delay={400} className="col-span-12 lg:col-span-6 lg:col-start-7">
                  <form
                    ref={formRef}
                    onSubmit={sendEmail}
                    className="flex flex-col gap-8"
                  >
                    <div className="border-b border-border pb-2 focus-within:border-primary transition-colors">
                      <input name="from_name" type="text" placeholder="Your name" required className="w-full bg-transparent outline-none font-mono text-sm py-2 placeholder:text-textMuted/50 text-textMain" />
                    </div>
                    <div className="border-b border-border pb-2 focus-within:border-primary transition-colors">
                      <input name="from_email" type="email" placeholder="you@email.com" required className="w-full bg-transparent outline-none font-mono text-sm py-2 placeholder:text-textMuted/50 text-textMain" />
                    </div>
                    <div className="border-b border-border pb-2 focus-within:border-primary transition-colors">
                      <input name="subject" type="text" placeholder="Job opportunity / Project inquiry" required className="w-full bg-transparent outline-none font-mono text-sm py-2 placeholder:text-textMuted/50 text-textMain" />
                    </div>
                    <div className="border-b border-border pb-2 focus-within:border-primary transition-colors">
                      <textarea name="message" placeholder="Tell me about your project or opportunity..." required rows={4} className="w-full bg-transparent outline-none font-mono text-sm py-2 placeholder:text-textMuted/50 resize-y text-textMain" />
                    </div>

                    {submitStatus === 'success' && (
                      <div className="text-[#56D8E8] font-mono text-sm">Message sent successfully!</div>
                    )}
                    {submitStatus === 'error' && (
                      <div className="text-red-500 font-mono text-sm">Unable to send your message. Please try again.</div>
                    )}

                    <button type="submit" disabled={isSubmitting} className="self-start px-8 py-4 bg-textMain text-background hover:bg-primary hover:text-background font-mono text-sm uppercase tracking-widest transition-colors flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed">
                      {isSubmitting ? 'Sending...' : 'Send Message'} {!isSubmitting && <Send size={16} className="group-hover:translate-x-1 transition-transform" />}
                    </button>
                  </form>
                </Reveal>
              </div>
            </section>
          )}
        </main>

        <footer className="py-8 border-t border-border px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 font-mono text-xs text-textMuted uppercase tracking-widest">
            <div>&copy; {new Date().getFullYear()} {portfolioData.hero.name}</div>
            <div className="flex items-center gap-6">
              {portfolioData.hero.githubUrl && <a href={portfolioData.hero.githubUrl} className="hover:text-primary transition-colors">GitHub</a>}
              {portfolioData.hero.linkedinUrl && <a href={portfolioData.hero.linkedinUrl} className="hover:text-primary transition-colors">LinkedIn</a>}
            </div>
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-primary transition-colors flex items-center gap-2">
              Back to Top <ArrowUp size={14} />
            </button>
          </div>
        </footer>

        {/* PROJECT MODAL */}
        <AnimatePresence>
          {selectedProject && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-12">
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setSelectedProject(null)}
                className="absolute inset-0 bg-background/90 backdrop-blur-sm cursor-pointer"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full max-w-4xl bg-surface border border-border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
              >
                <div className="p-8 border-b border-border flex justify-between items-start">
                  <div>
                    <h3 className="text-3xl font-bold uppercase tracking-tight mb-4">{selectedProject.title}</h3>
                    <div className="font-mono text-sm text-primary flex gap-4">
                      <span>{selectedProject.status}</span>
                    </div>
                  </div>
                  <button onClick={() => setSelectedProject(null)} className="p-2 border border-border hover:border-textMain transition-colors group">
                    <X size={24} className="text-textMuted group-hover:text-textMain transition-colors" />
                  </button>
                </div>

                <div className="p-8 overflow-y-auto custom-scrollbar flex flex-col gap-12">
                  <div className="text-lg text-textMuted leading-relaxed">
                    {selectedProject.description}
                  </div>

                  <div>
                    <div className="font-mono text-sm uppercase text-textMain mb-6 tracking-widest border-b border-border pb-2">Technologies</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedProject.tech.map((t: string) => (
                        <span key={t} className="px-3 py-1 bg-background border border-border font-mono text-xs">{t}</span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-6 mt-4">
                    {selectedProject.githubUrl && (
                      <a href={selectedProject.githubUrl} target="_blank" rel="noopener noreferrer" className="px-6 py-3 border border-border hover:border-primary text-textMain font-mono text-sm uppercase tracking-widest transition-colors flex items-center gap-2">
                        <Github size={16} /> Repository
                      </a>
                    )}
                    {selectedProject.liveUrl && (
                      <a href={selectedProject.liveUrl} target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-textMain text-background hover:bg-primary font-mono text-sm uppercase tracking-widest transition-colors flex items-center gap-2">
                        <ExternalLink size={16} /> Live Demo
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </LayoutGroup>
  );
};

export default App;
