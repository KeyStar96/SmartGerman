"use client";

import { useEffect, useRef } from "react";

// Konfiguration passend zu Ihrem globals.css
const CONFIG = {
  particleCount: 50, // Anzahl der Neuronen
  baseSpeed: 0.3, // Bewegungsgeschwindigkeit der Neuronen
  signalSpeed: 0.015, // Wie schnell das Lichtsignal reist (0.0 bis 1.0 pro Frame) - langsamer für angenehmere Wahrnehmung
  signalFrequency: 0.008, // Wahrscheinlichkeit eines Signals pro Frame (häufiger)
  neuronGlowDuration: 50, // Frames, wie lange ein Neuron nach dem Feuern leuchtet (länger für sanfteren Effekt)
  connectionsPerNeuron: 5, // Anzahl der Verbindungen pro Neuron
  viewportPadding: 0.2, // 20% Padding außerhalb des sichtbaren Bereichs
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
  connections: number[]; // Indizes der verbundenen Neuronen
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

    // Berechne erweiterten Bereich für Neuronen (außerhalb des sichtbaren Bereichs)
    const paddingX = width * CONFIG.viewportPadding;
    const paddingY = height * CONFIG.viewportPadding;
    const minX = -paddingX;
    const maxX = width + paddingX;
    const minY = -paddingY;
    const maxY = height + paddingY;

    // 1. Neuronen initialisieren (auch außerhalb des sichtbaren Bereichs)
    const particles: Point[] = [];
    for (let i = 0; i < CONFIG.particleCount; i++) {
      particles.push({
        x: minX + Math.random() * (maxX - minX),
        y: minY + Math.random() * (maxY - minY),
        vx: (Math.random() - 0.5) * CONFIG.baseSpeed,
        vy: (Math.random() - 0.5) * CONFIG.baseSpeed,
        glowTimer: 0, // Startet ohne Glow
        connections: [], // Wird nach Initialisierung gefüllt
      });
    }

    // 2. Verbindungen erstellen: Jedes Neuron bekommt genau CONFIG.connectionsPerNeuron Verbindungen
    particles.forEach((particle, index) => {
      const availableIndices = particles
        .map((_, i) => i)
        .filter((i) => i !== index);
      
      // Mische die verfügbaren Indizes zufällig
      const shuffled = availableIndices.sort(() => Math.random() - 0.5);
      
      // Wähle die ersten CONFIG.connectionsPerNeuron aus
      particle.connections = shuffled.slice(0, CONFIG.connectionsPerNeuron);
    });

    // Array für aktive Lichtsignale
    let signals: Signal[] = [];
    
    // Frame-Counter für seltene Signal-Generierung
    let frameCount = 0;

    // Resize Handler
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      // Aktualisiere auch den erweiterten Bereich
      const newPaddingX = width * CONFIG.viewportPadding;
      const newPaddingY = height * CONFIG.viewportPadding;
      // Neuronen können weiterhin außerhalb existieren, keine Neuinitialisierung nötig
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

        // Erweiterte Bounce-Logik: Neuronen können außerhalb des sichtbaren Bereichs existieren
        // Bounce nur an den erweiterten Rändern
        const paddingX = width * CONFIG.viewportPadding;
        const paddingY = height * CONFIG.viewportPadding;
        if (p.x < -paddingX || p.x > width + paddingX) p.vx *= -1;
        if (p.y < -paddingY || p.y > height + paddingY) p.vy *= -1;

        // Glow-Timer reduzieren
        if (p.glowTimer > 0) {
          p.glowTimer--;
        }
      });

      // B. Verbindungen zeichnen (nur die definierten Verbindungen pro Neuron)
      particles.forEach((p1, i) => {
        p1.connections.forEach((connectedIndex) => {
          // Zeichne nur einmal pro Verbindung (vermeide Duplikate)
          if (connectedIndex > i) {
            const p2 = particles[connectedIndex];
            
            // Verbindungslinie zeichnen (sehr dezent)
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = CONFIG.colors.line;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      // C. Zufälliges Feuern eines Neurons (sehr selten)
      if (Math.random() < CONFIG.signalFrequency) {
        // Wähle ein zufälliges Neuron
        const firingNeuron = particles[Math.floor(Math.random() * particles.length)];
        
        // Neuron leuchtet auf
        firingNeuron.glowTimer = CONFIG.neuronGlowDuration;
        
        // Sende Signale nur an die verbundenen Neuronen (nicht an alle)
        firingNeuron.connections.forEach((connectedIndex) => {
          const target = particles[connectedIndex];
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
        });
      }

      // D. Neuronen zeichnen (mit Glow-Effekt wenn aktiv)
      // Nur Neuronen zeichnen, die im sichtbaren Bereich oder nahe dran sind
      particles.forEach((p) => {
        // Zeichne Neuron auch wenn es leicht außerhalb ist (für sanfte Übergänge)
        const paddingX = width * 0.1;
        const paddingY = height * 0.1;
        if (p.x < -paddingX || p.x > width + paddingX || 
            p.y < -paddingY || p.y > height + paddingY) {
          return; // Überspringe Neuronen, die zu weit außerhalb sind
        }

        const isGlowing = p.glowTimer > 0;
        const glowIntensity = isGlowing ? p.glowTimer / CONFIG.neuronGlowDuration : 0;

        // Basis-Neuron
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = isGlowing 
          ? CONFIG.colors.neuronActive 
          : CONFIG.colors.base;
        ctx.fill();

        // Glow-Effekt wenn aktiv (sanfter Fade-out)
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