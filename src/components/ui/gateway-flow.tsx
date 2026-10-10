"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

export type GatewayFlowProps = {
  speed?: number;
  size?: number;
  density?: number;
  className?: string;
  opacity?: number;
};

export default function GatewayFlow({
  speed = 1,
  size = 1,
  density = 0.8,
  className = "",
  opacity = 1,
}: GatewayFlowProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let explosions: { x: number; y: number; radius: number; life: number }[] = [];
    let isVisible = true;

    // Pause animation when tab is inactive
    const handleVisibilityChange = () => {
      isVisible = document.visibilityState === "visible";
      if (isVisible) {
        lastTime = performance.now();
        render(lastTime);
      } else {
        cancelAnimationFrame(animationFrameId);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const handleResize = () => {
      if (!containerRef.current || !canvas) return;
      const rect = containerRef.current.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5); // Cap at 1.5x to save GPU
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      
      // Reset transform before scaling to avoid accumulation
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener("resize", handleResize, { passive: true });

    const handleClick = (e: MouseEvent) => {
      if (!canvas || !isVisible) return;
      explosions.push({ x: e.clientX, y: e.clientY, radius: 0, life: 1 });
    };

    window.addEventListener("click", handleClick, { passive: true });

    const paths: { isLeft: boolean; startY: number; particles: { t: number; speed: number }[] }[] = [];
    
    // Scale density based on mobile vs desktop for performance
    const isMobile = window.innerWidth < 768;
    const isLowPower = typeof navigator !== 'undefined' && (navigator as any).hardwareConcurrency <= 4;
    const basePaths = isLowPower ? 15 : (isMobile ? 25 : 55); 
    const numPaths = Math.max(10, Math.round(basePaths * density));

    for (let i = 0; i < numPaths; i++) {
      paths.push({
        isLeft: i % 2 === 0,
        startY: (i / numPaths) * height * 1.4 - height * 0.2,
        particles: [
          {
            t: Math.random(),
            speed: (0.0015 + Math.random() * 0.002) * speed,
          },
        ],
      });
    }

    function getBezierPoint(t: number, p0: any, p1: any, p2: any, p3: any) {
      const u = 1 - t;
      return {
        x: u ** 3 * p0.x + 3 * u ** 2 * t * p1.x + 3 * u * t ** 2 * p2.x + t ** 3 * p3.x,
        y: u ** 3 * p0.y + 3 * u ** 2 * t * p1.y + 3 * u * t ** 2 * p2.y + t ** 3 * p3.y,
      };
    }

    let lastTime = performance.now();

    function render(time: number) {
      if (!ctx || !canvas || !isVisible) return;
      
      const deltaTime = time - lastTime;
      lastTime = time;
      const timeScale = Math.min(deltaTime / 16.66, 2); 

      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      explosions.forEach((exp) => {
        exp.radius += 15 * speed * timeScale;
        exp.life -= 0.015 * speed * timeScale;
      });
      explosions = explosions.filter((exp) => exp.life > 0);

      // Pre-set styles to avoid state changes in loop
      ctx.strokeStyle = "rgba(110, 168, 254, 0.15)";
      ctx.lineWidth = 1.2 * size;
      ctx.setLineDash([1, 4]);

      ctx.beginPath();
      paths.forEach((path) => {
        const p0 = { x: path.isLeft ? 0 : width, y: path.startY };
        const p1 = { x: path.isLeft ? centerX * 0.5 : width - centerX * 0.5, y: path.startY };
        const p2 = { x: path.isLeft ? centerX * 0.8 : width - centerX * 0.8, y: centerY };
        const p3 = { x: centerX, y: centerY };

        ctx.moveTo(p0.x, p0.y);
        ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
      });
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "rgba(86, 216, 232, 0.7)";
      
      ctx.beginPath();
      paths.forEach((path) => {
        const p0 = { x: path.isLeft ? 0 : width, y: path.startY };
        const p1 = { x: path.isLeft ? centerX * 0.5 : width - centerX * 0.5, y: path.startY };
        const p2 = { x: path.isLeft ? centerX * 0.8 : width - centerX * 0.8, y: centerY };
        const p3 = { x: centerX, y: centerY };

        path.particles.forEach((p) => {
          p.t += p.speed * timeScale;
          if (p.t > 1) {
            p.t = 0;
            path.startY += (Math.random() - 0.5) * 10;
          }

          let pos = getBezierPoint(p.t, p0, p1, p2, p3);

          let dxTotal = 0, dyTotal = 0;
          for (let i = 0; i < explosions.length; i++) {
            const exp = explosions[i];
            let dx = pos.x - exp.x;
            let dy = pos.y - exp.y;
            let dist = Math.hypot(dx, dy);
            if (dist < exp.radius + 120 && dist > exp.radius - 120) {
              let force = (1 - Math.abs(dist - exp.radius) / 120) * exp.life;
              dxTotal += (dx / dist) * force * 80;
              dyTotal += (dy / dist) * force * 80;
            }
          }

          pos.x += dxTotal;
          pos.y += dyTotal;

          ctx.rect(pos.x - 1.5 * size, pos.y - 1.5 * size, 3 * size, 3 * size);
        });
      });
      ctx.fill();

      animationFrameId = requestAnimationFrame(render);
    }

    render(performance.now());

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("click", handleClick);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      cancelAnimationFrame(animationFrameId);
    };
  }, [shouldReduceMotion, speed, size, density]);

  if (shouldReduceMotion) {
    return (
      <div 
        className={`fixed inset-0 bg-[#0B0D10] pointer-events-none -z-10 ${className}`} 
        style={{ opacity }} 
      />
    );
  }

  return (
    <div 
      ref={containerRef} 
      className={`fixed inset-0 overflow-hidden pointer-events-none -z-10 ${className}`}
      style={{ opacity, backgroundColor: "#0B0D10" }}
    >
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{ background: "radial-gradient(circle at 50% 50%, rgba(110, 168, 254, 0.05) 0%, rgba(11, 13, 16, 0) 80%)" }}
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
    </div>
  );
}
