import React, { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

export const MovingBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const isDark = theme === 'dark';

    // Particle setup for Central University Red & White animated canvas
    const particleCount = 45;
    const particles: Array<{
      x: number;
      y: number;
      radius: number;
      vx: number;
      vy: number;
      color: string;
      alpha: number;
      pulseSpeed: number;
    }> = [];

    const lightColors = [
      'rgba(255, 7, 58, ',    // Electric Neon Red
      'rgba(206, 17, 38, ',   // Central University Crimson
      'rgba(0, 33, 71, ',     // Central University Navy
      'rgba(212, 175, 55, ',  // Central Gold Accent
      'rgba(255, 51, 102, '   // Neon Glow Pink
    ];

    const darkColors = [
      'rgba(255, 7, 58, ',    // High-Voltage Neon Red
      'rgba(255, 51, 102, ',  // Neon Rose Glow
      'rgba(206, 17, 38, ',   // Central Crimson Red
      'rgba(0, 50, 110, ',    // Illuminated Collegiate Navy
      'rgba(212, 175, 55, '   // Warm Gold Starlight
    ];

    const colors = isDark ? darkColors : lightColors;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 65 + 15,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.28 + 0.06,
        pulseSpeed: Math.random() * 0.01 + 0.005,
      });
    }

    let waveAngle = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      if (isDark) {
        // Deep obsidian navy base with subtle crimson atmospheric gradient
        const bgGradient = ctx.createLinearGradient(0, 0, width, height);
        bgGradient.addColorStop(0, '#060a14');    // Central Navy Midnight
        bgGradient.addColorStop(0.35, '#0a0a14'); // Pure Dark Glass
        bgGradient.addColorStop(0.7, '#14040a');  // Deep Neon Crimson Shadow
        bgGradient.addColorStop(1, '#05070d');    // Obsidian Space
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, width, height);

        // Subtle flowing ambient waves for dark mode
        waveAngle += 0.008;
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(220, 38, 38, 0.12)';
        ctx.lineWidth = 3;
        for (let x = 0; x < width; x += 15) {
          const y = Math.sin(x * 0.004 + waveAngle) * 40 + height * 0.5;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 2;
        for (let x = 0; x < width; x += 15) {
          const y = Math.cos(x * 0.003 - waveAngle) * 50 + height * 0.6;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      } else {
        // Crisp white & light slate base
        const bgGradient = ctx.createLinearGradient(0, 0, width, height);
        bgGradient.addColorStop(0, '#FFFFFF');    // Pure crisp white
        bgGradient.addColorStop(0.5, '#FFF8F8');  // Ultra light red tint
        bgGradient.addColorStop(1, '#F8FAFC');    // Clean slate base
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, width, height);

        // Subtle flowing ambient waves for light mode
        waveAngle += 0.008;
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(206, 17, 38, 0.06)';
        ctx.lineWidth = 3;
        for (let x = 0; x < width; x += 15) {
          const y = Math.sin(x * 0.004 + waveAngle) * 40 + height * 0.5;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle = 'rgba(206, 17, 38, 0.04)';
        ctx.lineWidth = 2;
        for (let x = 0; x < width; x += 15) {
          const y = Math.cos(x * 0.003 - waveAngle) * 50 + height * 0.6;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Draw floating glowing particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -p.radius) p.x = width + p.radius;
        if (p.x > width + p.radius) p.x = -p.radius;
        if (p.y < -p.radius) p.y = height + p.radius;
        if (p.y > height + p.radius) p.y = -p.radius;

        p.alpha += Math.sin(waveAngle * 2) * p.pulseSpeed;
        const currentAlpha = Math.max(0.03, Math.min(isDark ? 0.28 : 0.18, p.alpha));

        const radGradient = ctx.createRadialGradient(
          p.x, p.y, 0,
          p.x, p.y, p.radius
        );
        radGradient.addColorStop(0, p.color + currentAlpha + ')');
        radGradient.addColorStop(1, p.color + '0)');

        ctx.beginPath();
        ctx.fillStyle = radGradient;
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
    />
  );
};

