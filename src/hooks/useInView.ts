import { useEffect, useState, useRef } from 'react';

let observer: IntersectionObserver | null = null;
const callbacks = new Map<Element, () => void>();

const getObserver = () => {
  if (typeof window === 'undefined') return null;
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const callback = callbacks.get(entry.target);
            if (callback) {
              callback();
              observer?.unobserve(entry.target);
              callbacks.delete(entry.target);
            }
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' }
    );
  }
  return observer;
};

export const useInView = (delay: number = 0, active: boolean = true) => {
  const ref = useRef<HTMLElement | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    if (!active) return;
    const el = ref.current;
    if (!el) return;

    // Safety fallback
    const fallbackTimer = setTimeout(() => setIsRevealed(true), 2500);

    const obs = getObserver();
    if (!obs) {
      setIsRevealed(true);
      return;
    }

    callbacks.set(el, () => {
      if (delay > 0) {
        setTimeout(() => setIsRevealed(true), delay);
      } else {
        setIsRevealed(true);
      }
      clearTimeout(fallbackTimer);
    });
    
    obs.observe(el);

    return () => {
      clearTimeout(fallbackTimer);
      if (obs && el) {
        obs.unobserve(el);
        callbacks.delete(el);
      }
    };
  }, [delay]);

  return { ref, isRevealed };
};
