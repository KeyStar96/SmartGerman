"use client";

import React, { useRef, useEffect } from "react";

/**
 * Native Canvas 2D Implementation of the Neural Background
 * Removes dependencies on @react-three/fiber and three.js to avoid version conflicts.
 */
export default function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let animationFrameId: number;

    // Configuration
    const PARTICLE_COUNT = 100;
    const CONNECTION_DISTANCE = 200;
    const MOUSE_DISTANCE = 250;

    // State
    const particles: { x: number; y: number; vx: number; vy: number; }[] = [];
    const mouse = { x: 0, y: 0 };

    // Initialize particles
    const init = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;

      particles.length = 0;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
        });
      }
    };

    // Animation Loop
    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Update and Draw Particles
      particles.forEach((p, i) => {
        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Bounce off edges
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // Interaction with Mouse
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < MOUSE_DISTANCE) {
          const angle = Math.atan2(dy, dx);
          const force = (MOUSE_DISTANCE - dist) / MOUSE_DISTANCE;
          // Push away slightly or pull? "Pulsation" requested.
          // Let's make them excited/vibrate near mouse
          p.x -= Math.cos(angle) * force * 0.5;
          p.y -= Math.sin(angle) * force * 0.5;
        }

        // Color strategy: Scientific Minimalism (Adaptive)
        const isDark = document.documentElement.classList.contains("dark");
        const baseColor = isDark ? "255, 255, 255" : "26, 26, 26"; // Explicit White for Dark Mode

        // Draw Node
        ctx.beginPath();
        ctx.arc(p.x, p.y, isDark ? 2.5 : 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${baseColor === "26, 26, 26" ? "26, 26, 26" : "255, 255, 255"}, ${isDark ? 0.6 : 0.2})`; // High Opacity
        ctx.fill();

        // Draw Connections
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx2 = p.x - p2.x;
          const dy2 = p.y - p2.y;
          const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

          if (dist2 < CONNECTION_DISTANCE) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);

            // Opacity based on distance
            const alpha = 1 - (dist2 / CONNECTION_DISTANCE);
            ctx.strokeStyle = `rgba(${baseColor}, ${alpha * (isDark ? 0.4 : 0.15)})`;
            ctx.lineWidth = isDark ? 1.5 : 1;
            ctx.stroke();
          }
        }
      });

      // Mouse "Pulse" Highlight
      // Draw a subtle orange glow at mouse position
      /*
      const gradient = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, MOUSE_DISTANCE);
      gradient.addColorStop(0, "rgba(255, 107, 0, 0.05)");
      gradient.addColorStop(1, "rgba(255, 107, 0, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      */

      animationFrameId = requestAnimationFrame(animate);
    };

    // Event Listeners
    const handleResize = () => init();
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);

    init();
    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full z-0 pointer-events-none"
    />
  );
}
