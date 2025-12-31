"use client";

import { useEffect, useRef } from "react";

const CONFIG = {
  neuronDensity: 0.00006, // Leicht erhöht für mehr Fülle
  baseSpeed: 0.15,
  signalSpeed: 5,
  maxConnections: 4,
  signalDecay: 0.2,
  minIntensity: 0.15,
  chargeFrames: 25,
  colors: {
    neuron: "rgba(255, 255, 255, 0.2)",
    line: "rgba(255, 255, 255, 0.03)",
    pulse: "rgba(255, 255, 255, 0.9)",
  },
};

export default function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let neurons: any[] = [];
    let pulses: any[] = [];
    let isCycleActive = false;
    let animationFrameId: number;

    const init = () => {
      const dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      const fullHeight = document.documentElement.scrollHeight || height * 3;
      const count = Math.floor(width * fullHeight * CONFIG.neuronDensity);

      neurons = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * fullHeight,
        vx: (Math.random() - 0.5) * CONFIG.baseSpeed,
        vy: (Math.random() - 0.5) * CONFIG.baseSpeed,
        intensity: 0,
        chargeTimer: 0,
        connections: [],
      }));

      neurons.forEach((n, i) => {
        const neighbors = neurons
          .map((other, idx) => ({ idx, dist: Math.hypot(n.x - other.x, n.y - other.y) }))
          .filter((item) => item.idx !== i && item.dist < 250) // Von 180 auf 250 erhöht für bessere Verbindungen
          .sort((a, b) => a.dist - b.dist)
          .slice(0, CONFIG.maxConnections);
        n.connections = neighbors.map((nh) => nh.idx);
      });
    };

    const triggerNewCycle = () => {
      if (isCycleActive) return;

      const scrollY = window.scrollY;
      const visibleIndices = neurons
        .map((_, i) => i)
        .filter((i) => neurons[i].y > scrollY && neurons[i].y < scrollY + height);

      if (visibleIndices.length > 0) {
        const startIdx = visibleIndices[Math.floor(Math.random() * visibleIndices.length)];
        neurons[startIdx].intensity = 1.0;
        neurons[startIdx].chargeTimer = CONFIG.chargeFrames;
        isCycleActive = true;
      }
    };

    const update = () => {
      const scrollY = window.scrollY;
      let hasActiveElements = false;

      neurons.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > width) n.vx *= -1;
        const fullH = document.documentElement.scrollHeight;
        if (n.y < 0 || n.y > fullH) n.vy *= -1;

        if (n.chargeTimer > 0) {
          n.chargeTimer--;
          hasActiveElements = true;
          if (n.chargeTimer === 0) {
            n.connections.forEach((targetIdx: number) => {
              const nextIntensity = n.intensity * (1 - CONFIG.signalDecay);
              if (nextIntensity > CONFIG.minIntensity) {
                pulses.push({
                  from: neurons.indexOf(n),
                  to: targetIdx,
                  progress: 0,
                  intensity: nextIntensity,
                });
              }
            });
            n.intensity = 0;
          }
        }
      });

      pulses = pulses.filter((p) => {
        const from = neurons[p.from];
        const to = neurons[p.to];
        const dist = Math.hypot(from.x - to.x, from.y - to.y);
        p.progress += CONFIG.signalSpeed / dist;

        if (p.progress >= 1) {
          neurons[p.to].intensity = p.intensity;
          neurons[p.to].chargeTimer = CONFIG.chargeFrames;
          return false;
        }
        hasActiveElements = true;
        return true;
      });

      if (!hasActiveElements) {
        // Wenn nichts mehr leuchtet, erzwinge nach einer Sekunde einen Neustart
        if (!isCycleActive) {
          triggerNewCycle();
        } else {
          // Falls ein Zyklus als aktiv gilt, aber nichts passiert -> Reset
          isCycleActive = false;
        }
      }

      // Draw
      ctx.clearRect(0, 0, width, height);

      // Linien
      ctx.beginPath();
      ctx.strokeStyle = CONFIG.colors.line;
      ctx.lineWidth = 0.5;
      neurons.forEach((n, i) => {
        const dy = n.y - scrollY;
        if (dy < -100 || dy > height + 100) return;
        n.connections.forEach((cIdx: number) => {
          if (cIdx > i) {
            const target = neurons[cIdx];
            ctx.moveTo(n.x, dy);
            ctx.lineTo(target.x, target.y - scrollY);
          }
        });
      });
      ctx.stroke();

      // Pulse
      pulses.forEach((p) => {
        const from = neurons[p.from];
        const to = neurons[p.to];
        const startY = from.y - scrollY;
        const endY = to.y - scrollY;
        const curX = from.x + (to.x - from.x) * p.progress;
        const curY = startY + (endY - startY) * p.progress;

        ctx.beginPath();
        ctx.strokeStyle = `rgba(255, 255, 255, ${p.intensity * 0.5})`;
        ctx.lineWidth = 2;
        ctx.moveTo(from.x, startY);
        ctx.lineTo(curX, curY);
        ctx.stroke();

        ctx.beginPath();
        ctx.fillStyle = "#ffffff";
        ctx.arc(curX, curY, 1.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Neuronen Köpfe
      neurons.forEach((n) => {
        const dy = n.y - scrollY;
        if (dy < -50 || dy > height + 50) return;
        if (n.chargeTimer > 0) {
          ctx.beginPath();
          ctx.arc(n.x, dy, 2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${n.intensity})`;
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(n.x, dy, 1, 0, Math.PI * 2);
          ctx.fillStyle = CONFIG.colors.neuron;
          ctx.fill();
        }
      });

      animationFrameId = requestAnimationFrame(update);
    };

    init();
    update();
    window.addEventListener("resize", init);

    return () => {
      window.removeEventListener("resize", init);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ backgroundColor: 'transparent' }}
    />
  );
}
