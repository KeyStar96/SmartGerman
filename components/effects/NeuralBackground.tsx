"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";

const CONFIG = {
  neuronDensity: 0.00006,
  baseSpeed: 0.15,
  signalSpeed: 6,           // Etwas schneller für mehr Dynamik
  maxConnections: 5,        // Mehr potenzielle Wege, aber...
  signalDecay: 0.35,        // Drastischer Verlust: 35% pro Hop
  spreadProbability: 0.5,   // Nur 50% Chance, dass ein zweiter Pfad entsteht
  minIntensity: 0.1,        // Unter 10% stirbt das Signal
  chargeFrames: 20,         // Schnellere Reaktionszeit der Neuronen
};

// Farben basierend auf Theme
const getColors = (isDark: boolean) => {
  if (isDark) {
    return {
      neuron: "rgba(255, 255, 255, 0.15)",
      line: "rgba(255, 255, 255, 0.03)",
      pulseR: 255,
      pulseG: 255,
      pulseB: 255,
      activeNeuronR: 255,
      activeNeuronG: 255,
      activeNeuronB: 255,
    };
  } else {
    return {
      neuron: "rgba(0, 0, 0, 0.25)", // Dezentes Schwarz für Neuronen
      line: "rgba(0, 0, 0, 0.08)", // Sehr dezentes Grau für Linien
      pulseR: 75, // Graues Licht für Pulse
      pulseG: 75,
      pulseB: 75,
      activeNeuronR: 0, // Schwarze aktive Neuronen
      activeNeuronG: 0,
      activeNeuronB: 0,
    };
  }
};

export default function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDark, setIsDark] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  // Prüfe ob Darkmode aktiv ist
  const checkDarkMode = () => {
    return document.documentElement.classList.contains("dark");
  };

  useEffect(() => {
    // Initialisiere Darkmode-Status
    setIsDark(checkDarkMode());

    // Observer für Theme-Änderungen
    const observer = new MutationObserver(() => {
      setIsDark(checkDarkMode());
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Einblend-Animation nach Hero-Animationen
  useEffect(() => {
    // Hero-Animationen enden bei ca. 3.5s (letzte Animation: CTAs bei 2.5s + 1s Dauer)
    // Wir warten 4s für einen kleinen Buffer, dann blenden wir ein
    const timer = setTimeout(() => {
      setIsVisible(true);
      if (containerRef.current) {
        gsap.to(containerRef.current, {
          opacity: 1,
          duration: 1.5,
          ease: "power2.out",
        });
      }
    }, 4000); // 4 Sekunden nach Seitenladung

    return () => clearTimeout(timer);
  }, []);

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

      const fullHeight = document.documentElement.scrollHeight || height;
      const count = Math.floor(width * fullHeight * CONFIG.neuronDensity);

      neurons = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * fullHeight,
        vx: (Math.random() - 0.5) * CONFIG.baseSpeed,
        vy: (Math.random() - 0.5) * CONFIG.baseSpeed,
        intensity: 0,
        chargeTimer: 0,
        connections: []
      }));

      // Räumliche Suche für Verbindungen
      neurons.forEach((n, i) => {
        const neighbors = neurons
          .map((other, idx) => ({ idx, dist: Math.hypot(n.x - other.x, n.y - other.y) }))
          .filter(item => item.idx !== i && item.dist < 200)
          .sort((a, b) => a.dist - b.dist)
          .slice(0, CONFIG.maxConnections);
        n.connections = neighbors.map(nh => nh.idx);
      });
    };

    const triggerNewCycle = () => {
      if (isCycleActive) return;
      const scrollY = window.scrollY;
      const visibleIndices = neurons
        .map((_, i) => i)
        .filter(i => neurons[i].y > scrollY + 100 && neurons[i].y < scrollY + height - 100);

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

      neurons.forEach((n, i) => {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > document.documentElement.scrollHeight) n.vy *= -1;

        if (n.chargeTimer > 0) {
          n.chargeTimer--;
          hasActiveElements = true;
          if (n.chargeTimer === 0) {
            // Logik: Signal-Weitergabe begrenzen
            // Wir mischen die Verbindungen zufällig
            const shuffledTargets = [...n.connections].sort(() => Math.random() - 0.5);
            
            // Erstes Ziel bekommt das Signal immer (solange Intensität reicht)
            if (shuffledTargets.length > 0) {
              const nextInt = n.intensity * (1 - CONFIG.signalDecay);
              if (nextInt > CONFIG.minIntensity) {
                pulses.push({ from: i, to: shuffledTargets[0], progress: 0, intensity: nextInt });
                
                // Zweites Ziel nur mit spreadProbability (verhindert Explosion)
                if (shuffledTargets.length > 1 && Math.random() < CONFIG.spreadProbability) {
                  pulses.push({ from: i, to: shuffledTargets[1], progress: 0, intensity: nextInt * 0.8 });
                }
              }
            }
            n.intensity = 0;
          }
        }
      });

      pulses = pulses.filter(p => {
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

      if (!hasActiveElements && isCycleActive) {
        isCycleActive = false;
        setTimeout(triggerNewCycle, 2000);
      } else if (!isCycleActive && !hasActiveElements) {
        triggerNewCycle();
      }

      draw(scrollY);
      animationFrameId = requestAnimationFrame(update);
    };

    const draw = (scrollY: number) => {
      ctx.clearRect(0, 0, width, height);

      // Hole aktuelle Farben basierend auf Theme
      const colors = getColors(checkDarkMode());

      // 1. Linien (sehr schwach)
      ctx.beginPath();
      ctx.strokeStyle = colors.line;
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

      // 2. Pulse mit visuellem Decay auf der Strecke
      pulses.forEach(p => {
        const from = neurons[p.from];
        const to = neurons[p.to];
        const sY = from.y - scrollY;
        const eY = to.y - scrollY;
        const curX = from.x + (to.x - from.x) * p.progress;
        const curY = sY + (eY - sY) * p.progress;

        // Signal wird schwächer je weiter es reist
        const currentAlpha = p.intensity * (1 - p.progress * 0.5);

        ctx.beginPath();
        ctx.strokeStyle = `rgba(${colors.pulseR}, ${colors.pulseG}, ${colors.pulseB}, ${currentAlpha * 0.6})`;
        ctx.lineWidth = 1.5;
        ctx.moveTo(from.x, sY);
        ctx.lineTo(curX, curY);
        ctx.stroke();

        ctx.beginPath();
        ctx.fillStyle = `rgba(${colors.pulseR}, ${colors.pulseG}, ${colors.pulseB}, ${currentAlpha})`;
        ctx.arc(curX, curY, 1.2, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Neuronen
      neurons.forEach(n => {
        const dy = n.y - scrollY;
        if (dy < -50 || dy > height + 50) return;
        
        if (n.chargeTimer > 0) {
          ctx.beginPath();
          ctx.fillStyle = `rgba(${colors.activeNeuronR}, ${colors.activeNeuronG}, ${colors.activeNeuronB}, ${n.intensity})`;
          ctx.arc(n.x, dy, 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.fillStyle = colors.neuron;
          ctx.arc(n.x, dy, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    };

    init();
    update();
    window.addEventListener("resize", init);
    return () => {
      window.removeEventListener("resize", init);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDark]); // Re-render wenn Theme wechselt

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 -z-10 w-full h-full pointer-events-none"
      style={{ opacity: 0 }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
      />
    </div>
  );
}