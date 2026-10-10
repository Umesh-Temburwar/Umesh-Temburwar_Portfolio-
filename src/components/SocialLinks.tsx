import React from 'react';
import { profileLinks } from '../data/portfolio';
import {
  IconLinkedin,
  IconGithub,
  IconLeetcode,
  IconHackerrank,
  IconGeeksforgeeks,
} from './icons/BrandIcons';
import { Reveal } from './Reveal';

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  LinkedIn: IconLinkedin,
  GitHub: IconGithub,
  LeetCode: IconLeetcode,
  HackerRank: IconHackerrank,
  GeeksforGeeks: IconGeeksforgeeks,
};

interface SocialLinksProps {
  className?: string;
}

export const SocialLinks: React.FC<SocialLinksProps> = ({ className = '' }) => {
  const activeLinks = profileLinks.filter(
    (link) => link.url && link.url.startsWith('https://')
  );

  if (activeLinks.length === 0) return null;

  return (
    <Reveal delay={100} className={className}>
      <div className="flex flex-wrap items-center gap-3">
        {activeLinks.map((link) => {
          const Icon = iconMap[link.name];
          if (!Icon) return null;

          return (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${link.name} profile (opens in a new tab)`}
              className="group relative flex items-center justify-center w-[44px] h-[44px] md:w-10 md:h-10 rounded-md bg-transparent border border-white/10 text-textMuted hover:text-primary hover:border-primary/50 hover:shadow-[0_0_12px_rgba(245,165,36,0.15)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-[color,border-color,box-shadow] duration-200 ease-in-out motion-reduce:transition-none motion-reduce:hover:shadow-none"
            >
              <Icon className="w-5 h-5" />
              <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-surface border border-border text-xs text-textMain rounded opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 font-mono">
                {link.name}
              </span>
            </a>
          );
        })}
      </div>
    </Reveal>
  );
};
