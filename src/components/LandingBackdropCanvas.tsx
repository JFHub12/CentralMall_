import React, { useEffect, useRef } from 'react';

export const LandingBackdropCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    function resize() {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }

    window.addEventListener('resize', resize);
    resize();

    const particleCount = 35;
    const particles: Particle[] = [];

    class Particle {
      x!: number;
      y!: number;
      vy!: number;
      vx!: number;
      rotation!: number;
      vRot!: number;
      scale!: number;
      opacity!: number;
      type!: 'hat' | 'cash';

      constructor() {
        this.reset(true);
      }

      reset(initial = false) {
        this.x = Math.random() * width;
        this.y = initial ? Math.random() * height : -50;
        this.vy = Math.random() * 1.5 + 0.8;
        this.vx = (Math.random() - 0.5) * 0.8;
        this.rotation = Math.random() * Math.PI * 2;
        this.vRot = (Math.random() - 0.5) * 0.02;
        this.scale = Math.random() * 0.6 + 0.7;
        this.opacity = Math.random() * 0.35 + 0.2;
        this.type = Math.random() > 0.5 ? 'hat' : 'cash';
      }

      update() {
        this.y += this.vy;
        this.x += this.vx + Math.sin(this.y * 0.01) * 0.3;
        this.rotation += this.vRot;
        if (this.y > height + 50) this.reset(false);
      }

      draw() {
        if (!ctx) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.scale(this.scale, this.scale);
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = '#dc2626';
        ctx.strokeStyle = '#b91c1c';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 8;

        if (this.type === 'hat') {
          ctx.beginPath();
          ctx.moveTo(0, -18);
          ctx.lineTo(24, -6);
          ctx.lineTo(0, 6);
          ctx.lineTo(-24, -6);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(0, 2, 10, 0, Math.PI, false);
          ctx.fill();
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(0, -6);
          ctx.lineTo(12, 10);
          ctx.lineTo(16, 8);
          ctx.strokeStyle = '#dc2626';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else {
          ctx.beginPath();
          if ('roundRect' in ctx) {
            ctx.roundRect(-22, -12, 44, 24, 4);
          } else {
            ctx.rect(-22, -12, 44, 24);
          }
          ctx.fillStyle = 'rgba(220, 38, 38, 0.15)';
          ctx.fill();
          ctx.stroke();

          ctx.beginPath();
          if ('roundRect' in ctx) {
            ctx.roundRect(-18, -8, 36, 16, 2);
          } else {
            ctx.rect(-18, -8, 36, 16);
          }
          ctx.stroke();

          ctx.font = 'bold 16px sans-serif';
          ctx.fillStyle = '#dc2626';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('$', 0, 1);
        }

        ctx.restore();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    function animate() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.update();
        p.draw();
      }
      animId = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      id="backdropCanvas"
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    />
  );
};
