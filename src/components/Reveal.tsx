import React, { ElementType } from 'react';
import { useInView } from '../hooks/useInView';

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  y?: string | number;
  as?: ElementType;
  className?: string;
  style?: React.CSSProperties;
  active?: boolean;
}

export function Reveal({ 
  children, 
  delay = 0, 
  y = 20, 
  as: Component = 'div', 
  className = '', 
  style,
  active = true
}: RevealProps) {
  const { ref, isRevealed } = useInView(delay, active);

  return (
    <Component
      ref={ref as any}
      className={`reveal-wrapper ${isRevealed ? 'reveal-animate' : 'reveal-initial'} ${className}`}
      style={{
        ...style,
        '--reveal-y': typeof y === 'number' ? `${y}px` : y,
      } as React.CSSProperties}
    >
      {children}
    </Component>
  );
}
