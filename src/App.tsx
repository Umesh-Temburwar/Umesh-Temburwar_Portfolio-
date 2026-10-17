import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion, useScroll, useTransform, useMotionValue, useAnimationFrame, useMotionValueEvent, LayoutGroup } from 'framer-motion';
import { ArrowUp, ArrowRight, ExternalLink, X, Menu } from 'lucide-react';
import { useLocation, Link, Routes, Route } from 'react-router-dom';
import Projects from './pages/Projects';
import Resume from './pages/Resume';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  const location = useLocation();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const scrolled = latest > (typeof window !== 'undefined' ? window.innerHeight * 0.4 : 300);
    if (scrolled !== isScrolled) setIsScrolled(scrolled);
  });

  return (
    <nav className={`fixed w-full top-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-surface/95 backdrop-blur-md border-b border-border shadow-sm' : 'bg-transparent'}`}>
      <div className="max-w-[1280px] mx-auto w-full p-4 md:p-6 flex justify-between items-center relative">
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

        <div className="md:hidden flex items-center gap-4">
          <Link to="/contact" className="font-mono text-xs text-textMain border border-border px-3 py-1.5 hover:text-primary transition-colors">Get in touch</Link>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-textMain hover:text-primary transition-colors">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute top-16 right-4 md:hidden bg-surface border border-border shadow-2xl p-4 flex flex-col gap-4 min-w-[200px] z-[100]"
            >
              {portfolioData.header.navLinks.map((link) => {
                const isActive = location.pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    to={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`text-lg font-mono ${isActive ? 'text-primary' : 'text-textMain hover:text-primary'} transition-colors border-b border-border/50 pb-2 last:border-0 last:pb-0`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
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
      initial={{ opacity: 0, y: 16 }}
      animate={isLoaded ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
      transition={{ duration: 0.8, delay: 0.8 }}
      className="w-full aspect-[4/5] relative group lg:max-w-none max-w-[420px] md:max-w-[420px] sm:max-w-[320px] mx-auto"
    >
      <div className="absolute inset-0 bg-surface/50 border border-border p-2">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,165,36,0.08)_0%,transparent_70%)] pointer-events-none" />
        <div className="absolute top-0 left-0 w-4 h-4 border-t-[1.5px] border-l-[1.5px] border-primary" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-[1.5px] border-r-[1.5px] border-primary" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-[1.5px] border-l-[1.5px] border-primary" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-[1.5px] border-r-[1.5px] border-primary" />
        <div className="w-full h-full bg-surface relative z-10 overflow-hidden">
          {portfolioData.hero.profilePhoto && !imageError ? (
            <img
              src={portfolioData.hero.profilePhoto}
              alt={portfolioData.hero.name}
              width={640}
              height={800}
              fetchPriority="high"
              decoding="async"
              className="w-full h-full object-cover object-top"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-mono text-sm text-textMuted bg-surface border border-border">UT</div>
          )}
        </div>
      </div>
      <div className="hidden sm:block absolute -left-4 -bottom-4 max-w-[30%] bg-[#11151B] border border-border p-3 z-20 shadow-xl">
        <div className="font-mono text-[12px] text-textMain leading-tight whitespace-nowrap">{portfolioData.hero.idCard?.line1}</div>
        <div className="font-mono text-[10px] text-textMuted mt-1">{portfolioData.hero.idCard?.line2}</div>
      </div>
    </motion.div>
  );
};

const App = () => {
  const shouldReduceMotion = useReducedMotion();
  const [isLoaded, setIsLoaded] = useState(true);
  const [selectedProject, setSelectedProject] = useState<typeof portfolioData.projects[0] | null>(null);

  const { scrollY } = useScroll();


  const location = useLocation();

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

    return () => {
      window.removeEventListener('scroll', onScroll);
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


        {/* Scroll Progress Bar */}
        <div
          ref={progressBarRef}
          className="fixed top-0 left-0 right-0 h-[2px] bg-primary origin-left z-[100]"
          style={{ transform: 'scaleX(0)' }}
          aria-hidden="true"
        />

        <NavBar />

        <main>
          <Routes>
            <Route path="/" element={
              <>
              {/* HERO SECTION */}
              <section id="hero" ref={heroRef} className="min-h-[calc(100svh-80px)] relative flex flex-col justify-center px-4 md:px-6 pt-24 pb-12 w-full mx-auto overflow-hidden">
                {/* Subtle radial vignette */}
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />

                <div
                  ref={heroVisualRef}
                  className="w-full max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10 items-center"
                >

                  {/* Left Column: Text & CTAs */}
                  <div className="lg:col-span-7 flex flex-col min-w-0">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={isLoaded ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                      transition={{ duration: 0.8, delay: 0.1 }}
                      className="font-mono text-textMuted mb-6 flex items-center gap-2"
                    >
                      <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse motion-reduce:animate-none"></span>
                      Open to software engineering roles
                    </motion.div>

                    <div className="overflow-hidden mb-2">
                      <motion.h1
                        initial={{ y: "100%" }}
                        animate={isLoaded ? { y: 0 } : { y: "100%" }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.18 }}
                        className="font-bold leading-[0.95] tracking-tight uppercase break-normal min-w-0"
                        style={{ fontSize: "clamp(2.5rem, 6.5vw, 6.5rem)", letterSpacing: "-0.02em" }}
                      >
                        {portfolioData.hero.name.split(' ')[0]}
                      </motion.h1>
                    </div>
                    <div className="overflow-hidden mb-6 flex gap-4">
                      <motion.h1
                        initial={{ y: "100%" }}
                        animate={isLoaded ? { y: 0 } : { y: "100%" }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.26 }}
                        className="font-bold leading-[0.95] tracking-tight uppercase text-textMuted break-normal min-w-0"
                        style={{ fontSize: "clamp(2.5rem, 6.5vw, 6.5rem)", letterSpacing: "-0.02em" }}
                      >
                        {portfolioData.hero.name.split(' ').slice(1).join(' ')}
                      </motion.h1>
                    </div>

                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={isLoaded ? { opacity: 1 } : { opacity: 0 }}
                      transition={{ duration: 0.8, delay: 0.34 }}
                      className="font-mono text-textMuted mb-6 flex items-center gap-2"
                    >
                      <span className="inline-block w-2 h-2 bg-primary"></span>
                      {portfolioData.hero.role}
                    </motion.p>

                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={isLoaded ? { opacity: 1 } : { opacity: 0 }}
                      transition={{ duration: 0.8, delay: 0.42 }}
                      className="text-xl md:text-2xl max-w-2xl text-textMuted mb-6 leading-relaxed"
                    >
                      I build full-stack web applications using React, Node.js and TypeScript, with a focus on scalable architecture and clean interfaces.
                    </motion.p>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={isLoaded ? { opacity: 1 } : { opacity: 0 }}
                      transition={{ duration: 0.8, delay: 0.5 }}
                      className="flex flex-wrap gap-2 mb-10"
                    >
                      {portfolioData.hero.heroStack?.map(tech => (
                        <span key={tech} className="font-mono text-[12px] border border-white/10 text-textMuted px-3 py-1 rounded-sm">{tech}</span>
                      ))}
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={isLoaded ? { opacity: 1 } : { opacity: 0 }}
                      transition={{ duration: 0.8, delay: 0.58 }}
                      className="flex flex-col sm:flex-row gap-6 w-full mb-10"
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
                    
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={isLoaded ? { opacity: 1 } : { opacity: 0 }}
                      transition={{ duration: 0.8, delay: 0.66 }}
                      className="flex flex-col sm:flex-row sm:items-center gap-4"
                    >
                      <span className="font-mono text-sm text-textMuted">Find me on</span>
                      <SocialLinks />
                    </motion.div>
                  </div>
                  <div className="lg:col-span-5 flex justify-center lg:justify-end mt-12 lg:mt-0">
                    <HeroVisual isLoaded={isLoaded} />
                  </div>
                </div>
                
                {/* Scroll Cue Desktop */}
                <motion.div 
                  className="hidden lg:flex absolute bottom-8 left-6 items-center gap-2 -rotate-90 origin-left"
                  style={{ opacity: useTransform(scrollY, [0, 80], [1, 0]) }}
                >
                  <span className="font-mono text-[10px] text-textMuted uppercase tracking-widest">Scroll</span>
                  <div className="w-12 h-[1px] bg-border relative overflow-hidden">
                    <div className="absolute inset-0 w-full h-full bg-primary animate-scroll-line motion-reduce:animate-none" />
                  </div>
                </motion.div>
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
                              <span className="hidden md:inline">GÇó</span>
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
                              <span className="hidden md:inline">GÇó</span>
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
                      portfolioData.certifications.map((cert: { title: string; issuer: string; date: string; link: string; image: string; credentialType?: string; topics?: string[]; hasPdf?: boolean }, idx: number) => (
                        <Reveal
                          key={idx}
                          delay={Math.min(idx * 80, 480)}
                          className="border border-border bg-surface flex flex-col group hover:border-primary/50 transition-colors relative overflow-hidden"
                        >
                          {cert.image && (
                            <div className="w-full h-40 overflow-hidden bg-background">
                              <img src={cert.image} alt={cert.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-60 group-hover:opacity-80" />
                            </div>
                          )}
                          <div className="p-6 flex flex-col flex-grow">
                            {cert.credentialType && (
                              <div className="text-[10px] font-mono text-primary uppercase tracking-widest mb-3">
                                {cert.credentialType}
                              </div>
                            )}
                            <h4 className="font-bold text-lg leading-tight mb-2 group-hover:text-primary transition-colors">{cert.title}</h4>
                            <div className="font-mono text-xs text-textMuted mb-4">{cert.issuer} GÇó {cert.date}</div>
                            
                            {cert.topics && cert.topics.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-6 mt-auto">
                                {cert.topics.slice(0, 4).map((topic: string) => (
                                  <span key={topic} className="font-mono text-[10px] text-textMuted bg-background border border-border px-2 py-1">{topic}</span>
                                ))}
                                {cert.topics.length > 4 && (
                                  <span className="font-mono text-[10px] text-textMuted bg-background border border-border px-2 py-1">+{cert.topics.length - 4}</span>
                                )}
                              </div>
                            )}
                            
                            <div className="mt-auto pt-4 border-t border-border/50">
                              {cert.link && cert.hasPdf !== false ? (
                                <a href={cert.link} target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-primary flex items-center gap-2 hover:underline w-fit">
                                  VIEW CERTIFICATE <ExternalLink size={12} />
                                </a>
                              ) : cert.link ? (
                                <span className="text-xs font-mono text-textMuted flex items-center gap-2 opacity-50 cursor-not-allowed w-fit">
                                  CERTIFICATE PDF COMING SOON
                                </span>
                              ) : (
                                <span className="text-xs font-mono text-textMuted flex items-center gap-2 opacity-50 cursor-not-allowed w-fit">
                                  CREDENTIAL UNAVAILABLE
                                </span>
                              )}
                            </div>
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
            } />
            <Route path="/projects" element={<Projects />} />
            <Route path="/resume" element={<Resume />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
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


