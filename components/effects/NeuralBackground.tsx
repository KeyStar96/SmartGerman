"use client";

import { useEffect, useRef } from "react";

// Konfiguration passend zu Ihrem globals.css
const CONFIG = {
  particleCount: 50, // Anzahl der Neuronen
  baseSpeed: 0.3, // Bewegungsgeschwindigkeit der Neuronen
  signalSpeed: 0.03, // Wie schnell das Lichtsignal reist (0.0 bis 1.0 pro Frame)
  signalFrequency: 0.001, // Wahrscheinlichkeit eines Signals pro Frame (sehr selten)
  neuronGlowDuration: 15, // Frames, wie lange ein Neuron nach dem Feuern leuchtet
  colors: {
    base: "rgba(1, 42, 46, 0.6)", // --dm-surface-teal (abgedunkelt)
    line: "rgba(56, 62, 78, 0.15)", // --dm-border-slate (sehr dezent)
    signal: "rgba(255, 255, 255, 0.4)", // Weiß, sehr dezent
    neuronActive: "#FF5C00", // --primary-orange für aktive Neuronen
    neuronGlow: "rgba(255, 92, 0, 0.3)", // Orange Glow für aktive Neuronen
  },
};

interface Point {
  x: number;
  y: number;
  vx: number;
  vy: number;
  glowTimer: number; // Timer für das Aufleuchten (0 = nicht aktiv)
}

interface Signal {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  progress: number; // 0.0 bis 1.0
  totalDistance: number; // Gesamtdistanz für Fade-out
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
        glowTimer: 0, // Startet ohne Glow
      });
    }

    // Array für aktive Lichtsignale
    let signals: Signal[] = [];
    
    // Frame-Counter für seltene Signal-Generierung
    let frameCount = 0;

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
      frameCount++;

      // A. Neuronen bewegen
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        // Bounce an den Rändern
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // Glow-Timer reduzieren
        if (p.glowTimer > 0) {
          p.glowTimer--;
        }
      });

      // B. ALLE Verbindungen zeichnen (alle Neuronen sind miteinander verbunden)
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i];
          const p2 = particles[j];

          // Verbindungslinie zeichnen (sehr dezent)
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = CONFIG.colors.line;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }

      // C. Zufälliges Feuern eines Neurons (sehr selten)
      if (Math.random() < CONFIG.signalFrequency) {
        // Wähle ein zufälliges Neuron
        const firingNeuron = particles[Math.floor(Math.random() * particles.length)];
        
        // Neuron leuchtet auf
        firingNeuron.glowTimer = CONFIG.neuronGlowDuration;
        
        // Sende Signale an ALLE anderen Neuronen
        particles.forEach((target) => {
          if (target !== firingNeuron) {
            const dx = target.x - firingNeuron.x;
            const dy = target.y - firingNeuron.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            signals.push({
              startX: firingNeuron.x,
              startY: firingNeuron.y,
              endX: target.x,
              endY: target.y,
              progress: 0,
              totalDistance: dist,
            });
          }
        });
      }

      // D. Neuronen zeichnen (mit Glow-Effekt wenn aktiv)
      particles.forEach((p) => {
        const isGlowing = p.glowTimer > 0;
        const glowIntensity = isGlowing ? p.glowTimer / CONFIG.neuronGlowDuration : 0;

        // Basis-Neuron
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = isGlowing 
          ? CONFIG.colors.neuronActive 
          : CONFIG.colors.base;
        ctx.fill();

        // Glow-Effekt wenn aktiv
        if (isGlowing) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 92, 0, ${glowIntensity * 0.2})`;
          ctx.fill();
        }
      });

      // E. Signale aktualisieren und zeichnen
      signals = signals.filter((sig) => {
        sig.progress += CONFIG.signalSpeed;

        // Position des Signals interpolieren
        const currentX = sig.startX + (sig.endX - sig.startX) * sig.progress;
        const currentY = sig.startY + (sig.endY - sig.startY) * sig.progress;

        // Berechne zurückgelegte Distanz
        const traveledDistance = sig.progress * sig.totalDistance;
        
        // Opazität nimmt mit der Distanz ab (Fade-out)
        // Maximal sichtbar bei 0, komplett unsichtbar bei totalDistance
        const maxFadeDistance = sig.totalDistance;
        const fadeProgress = Math.min(traveledDistance / maxFadeDistance, 1);
        const signalOpacity = (1 - fadeProgress) * 0.4; // Startet bei 0.4, endet bei 0

        // Signal nur zeichnen wenn noch sichtbar
        if (signalOpacity > 0.01) {
          // Sehr dezentes weißes Lichtsignal
          ctx.beginPath();
          ctx.arc(currentX, currentY, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${signalOpacity})`;
          ctx.fill();
        }

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