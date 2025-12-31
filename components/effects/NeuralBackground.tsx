"use client";

import { useEffect, useRef } from "react";

const CONFIG = {
  neuronDensity: 0.00008, // Leicht erhöht für Tiefeneffekt
  baseSpeed: 0.2,
  signalSpeed: 7,
  maxConnections: 4,
  chargeFrames: 20,
  mouseRadius: 200,      // Radius der Maus-Interaktion
  parallaxFactor: 0.4,   // Stärke des Tiefeneffekts
};

export default function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let neurons: any[] = [];
    let pulses: any[] = [];
    let animationFrameId: number;

    const init = () => {
      const dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      neurons = [];
      const area = width * height;
      const count = Math.floor(area * CONFIG.neuronDensity);

      for (let i = 0; i < count; i++) {
        // Z-Ebene bestimmt Größe, Speed und Blur (0 = hinten, 1 = vorne)
        const z = Math.random();
        neurons.push({
          x: Math.random() * width,
          y: Math.random() * height,
          z: z, 
          vx: (Math.random() - 0.5) * CONFIG.baseSpeed * (z + 0.5),
          vy: (Math.random() - 0.5) * CONFIG.baseSpeed * (z + 0.5),
          radius: z * 1.5 + 0.5,
          intensity: 0,
          chargeTimer: 0,
          connections: [],
          blur: (1 - z) * 2 // Hintere Neuronen sind etwas unscharfer
        });
      }

      // Verbindungen nur auf ähnlichen Z-Ebenen für mehr Logik
      neurons.forEach((n1, i) => {
        const potentialIndices = neurons
          .map((_, idx) => idx)
          .filter(idx => idx !== i && Math.abs(neurons[idx].z - n1.z) < 0.3)
          .sort((a, b) => {
            const distA = Math.hypot(n1.x - neurons[a].x, n1.y - neurons[a].y);
            const distB = Math.hypot(n1.x - neurons[b].x, n1.y - neurons[b].y);
            return distA - distB;
          });

        n1.connections = potentialIndices.slice(0, Math.floor(Math.random() * 3) + 2);
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const update = () => {
      ctx.clearRect(0, 0, width, height);
      const isDark = document.documentElement.classList.contains("dark");
      
      // Farben basierend auf Theme
      const colorAlpha = isDark ? 0.15 : 0.25;
      const pulseColor = isDark ? "255, 255, 255" : "0, 0, 0";

      // 1. Neuronen Update & Maus-Interaktion
      neurons.forEach(n => {
        // Bewegung
        n.x += n.vx;
        n.y += n.vy;

        // Maus-Abstoßung & Leuchten
        const dx = n.x - mouseRef.current.x;
        const dy = n.y - mouseRef.current.y;
        const dist = Math.hypot(dx, dy);

        if (dist < CONFIG.mouseRadius) {
          const force = (1 - dist / CONFIG.mouseRadius);
          n.x += (dx / dist) * force * 2;
          n.y += (dy / dist) * force * 2;
          n.intensity = Math.max(n.intensity, force * 0.6);
        }

        // Screen Wrap
        if (n.x < 0) n.x = width;
        if (n.x > width) n.x = 0;
        if (n.y < 0) n.y = height;
        if (n.y > height) n.y = 0;

        // Zeichnen
        ctx.beginPath();
        const alpha = n.chargeTimer > 0 ? n.intensity : colorAlpha;
        ctx.fillStyle = `rgba(${pulseColor}, ${alpha})`;
        // Parallaxe-Effekt: Radius skaliert mit Z
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fill();

        if (n.chargeTimer > 0) n.chargeTimer--;
        n.intensity *= 0.95;
      });

      // 2. Verbindungen zeichnen (nur wenn nah beieinander)
      ctx.beginPath();
      ctx.strokeStyle = isDark ? `rgba(255,255,255,0.03)` : `rgba(0,0,0,0.03)`;
      neurons.forEach(n => {
        n.connections.forEach((targetIdx: number) => {
          const target = neurons[targetIdx];
          const dist = Math.hypot(n.x - target.x, n.y - target.y);
          if (dist < 150) {
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(target.x, target.y);
          }
        });
      });
      ctx.stroke();

      // 3. Signale / Pulse
      if (Math.random() < 0.03) {
        const start = Math.floor(Math.random() * neurons.length);
        pulses.push({
          from: start,
          to: neurons[start].connections[0],
          progress: 0,
          z: neurons[start].z
        });
      }

      pulses = pulses.filter(p => {
        p.progress += (CONFIG.signalSpeed / 1000) * (p.z + 0.5);
        if (p.progress >= 1) {
          const target = neurons[p.to];
          target.chargeTimer = CONFIG.chargeFrames;
          target.intensity = 1;
          return false;
        }

        const n1 = neurons[p.from];
        const n2 = neurons[p.to];
        if (!n2) return false;

        const curX = n1.x + (n2.x - n1.x) * p.progress;
        const curY = n1.y + (n2.y - n1.y) * p.progress;

        ctx.beginPath();
        ctx.fillStyle = `rgba(${pulseColor}, ${0.8 * p.z})`;
        ctx.arc(curX, curY, 1 * p.z + 0.5, 0, Math.PI * 2);
        ctx.fill();
        return true;
      });

      animationFrameId = requestAnimationFrame(update);
    };

    init();
    update();
    window.addEventListener("resize", init);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("resize", init);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 pointer-events-none transition-opacity duration-1000"
      style={{ filter: "contrast(1.1)" }}
    />
  );
}