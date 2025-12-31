"use client";

import { useEffect, useRef } from "react";

// Konfiguration passend zu Ihrem globals.css
const CONFIG = {
  particleCount: 60, // Anzahl der Neuronen
  connectionDistance: 150, // Max Distanz für Verbindungen
  baseSpeed: 0.5, // Bewegungsgeschwindigkeit der Neuronen
  signalSpeed: 4.0, // Wie schnell das Lichtsignal reist
  signalFrequency: 0.02, // Wahrscheinlichkeit eines Signals pro Frame (Feuerrate)
  colors: {
    base: "rgba(1, 42, 46, 0.8)", // --dm-surface-teal (abgedunkelt)
    line: "rgba(56, 62, 78, 0.3)", // --dm-border-slate (transparent)
    signal: "#FF5C00", // --primary-orange
    glow: "rgba(255, 92, 0, 0.4)", // Orange Glow
  },
};

interface Point {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Signal {
  start: Point;
  end: Point;
  progress: number; // 0.0 bis 1.0
}

export default function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // 1. Neuronen initialisieren
    const particles: Point[] = [];
    for (let i = 0; i < CONFIG.particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * CONFIG.baseSpeed,
        vy: (Math.random() - 0.5) * CONFIG.baseSpeed,
      });
    }

    // Array für aktive Lichtsignale
    let signals: Signal[] = [];

    // Resize Handler
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Animation Loop
    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // A. Neuronen bewegen & zeichnen
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        // Bounce an den Rändern
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // Neuron zeichnen (Punkt)
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = CONFIG.colors.base;
        ctx.fill();
      });

      // B. Verbindungen & Signale verwalten
      // Wir iterieren durch alle Paare
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i];
          const p2 = particles[j];

          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < CONFIG.connectionDistance) {
            // 1. Statische Verbindungslinie zeichnen
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            // Opazität basierend auf Distanz (näher = sichtbarer)
            const opacity = 1 - dist / CONFIG.connectionDistance;
            ctx.strokeStyle = `rgba(56, 62, 78, ${opacity * 0.4})`;
            ctx.lineWidth = 1;
            ctx.stroke();

            // 2. Zufälliges "Feuern" von Signalen (Neuronale Aktivität)
            if (Math.random() < CONFIG.signalFrequency * 0.05) {
                // Nur feuern, wenn noch nicht zu viele Signale unterwegs sind
                // Zufällige Richtung: p1 -> p2 oder p2 -> p1
                if (Math.random() > 0.5) {
                    signals.push({ start: p1, end: p2, progress: 0 });
                } else {
                    signals.push({ start: p2, end: p1, progress: 0 });
                }
            }
          }
        }
      }

      // C. Signale aktualisieren und zeichnen
      // Wir filtern Signale heraus, die angekommen sind (progress >= 1)
      signals = signals.filter((sig) => {
        sig.progress += CONFIG.signalSpeed / 100; // Geschwindigkeit anpassen

        // Position des Signals interpolieren
        const currentX = sig.start.x + (sig.end.x - sig.start.x) * sig.progress;
        const currentY = sig.start.y + (sig.end.y - sig.start.y) * sig.progress;

        // Signal zeichnen (Glowing Orb)
        ctx.beginPath();
        ctx.arc(currentX, currentY, 3, 0, Math.PI * 2);
        ctx.fillStyle = CONFIG.colors.signal;
        // Glow Effekt
        ctx.shadowBlur = 10;
        ctx.shadowColor = CONFIG.colors.glow;
        ctx.fill();
        
        // Reset Shadow für Performance
        ctx.shadowBlur = 0;

        return sig.progress < 1;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 -z-[1] pointer-events-none overflow-hidden bg-background transition-colors duration-500"
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-60 dark:opacity-80" />
    </div>
  );
}