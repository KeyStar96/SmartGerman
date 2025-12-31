"use client";

import { useEffect, useRef } from "react";

/**
 * CONFIG: Awwwards-Level Tuning
 */
const CONFIG = {
  // Gitter & Dichte
  neuronDensity: 0.00008,     // Dichte (Punkte pro Pixel)
  connectionDistance: 170,    // Wie weit reichen Verbindungen?
  
  // Eigenbewegung (Das "Schwimmen" im Quadrat)
  wanderRadius: 0.5,          // Wie stark wollen sie sich von selbst bewegen?
  wanderSpeed: 0.02,          // Wie schnell ändern sie die Richtung?
  springStiffness: 0.008,     // Hält sie an der Basisposition (niedriger = lockerer)
  
  // Maus-Interaktion
  mouseInteractionRadius: 200, 
  mouseForce: 0.02,           // VIEL schwächer als vorher (subtiler Magnet)
  damping: 0.94,              // Höhere Dämpfung = "öligeres" Gefühl
  
  // Signale (Kettenreaktion)
  signalSpeed: 3.5,           // Pixel pro Frame
  signalLength: 40,           // Länge des Schweifs
  signalColor: "255, 92, 0",  // Primary Orange
  signalDecay: 0.60,          // Signalstärke nach jedem Hop (60% bleibt übrig)
  minSignalStrength: 0.15,    // Unter diesem Wert stirbt das Signal (verhindert unendliche Loops)
  
  // Optik
  baseColor: "255, 255, 255", 
  baseOpacity: 0.12,          // Ruhezustand fast unsichtbar
  flashDecay: 0.05,           // Wie schnell das Aufleuchten verblasst
  particleSize: 1.8,
};

interface Neuron {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  wanderAngle: number; // Für die zufällige Bewegung
  flash: number;       // Helligkeit des Aufleuchtens (0.0 - 1.0)
  connections: number[];
}

interface Pulse {
  id: number;        // Eindeutige ID für Performance-Tracking
  fromIndex: number;
  toIndex: number;
  progress: number;
  totalDist: number;
  strength: number;  // Stärke des Signals (1.0 = Start, wird schwächer)
}

export default function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });
  const neuronsRef = useRef<Neuron[]>([]);
  const pulsesRef = useRef<Pulse[]>([]);
  const pulseIdCounter = useRef(0); // Um Pulse eindeutig zu identifizieren

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    // --- 1. Netzwerk erstellen ---
    const initNetwork = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const area = width * height;
      const numNeurons = Math.floor(area * CONFIG.neuronDensity);
      
      const newNeurons: Neuron[] = [];

      for (let i = 0; i < numNeurons; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        newNeurons.push({
          x, y,
          baseX: x,
          baseY: y,
          vx: 0,
          vy: 0,
          wanderAngle: Math.random() * Math.PI * 2,
          flash: 0,
          connections: [],
        });
      }

      // Verbindungen knüpfen
      for (let i = 0; i < numNeurons; i++) {
        for (let j = i + 1; j < numNeurons; j++) {
          const dx = newNeurons[i].x - newNeurons[j].x;
          const dy = newNeurons[i].y - newNeurons[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < CONFIG.connectionDistance) {
            newNeurons[i].connections.push(j);
            newNeurons[j].connections.push(i);
          }
        }
      }

      neuronsRef.current = newNeurons;
      pulsesRef.current = [];
    };

    // --- Helper: Neuen Impuls starten ---
    const spawnPulse = (fromIdx: number, toIdx: number, strength: number) => {
      pulsesRef.current.push({
        id: pulseIdCounter.current++,
        fromIndex: fromIdx,
        toIndex: toIdx,
        progress: 0,
        totalDist: 0, // Wird im Draw berechnet
        strength: strength
      });
    };

    // --- 2. Physik Update ---
    const updatePhysics = () => {
      const neurons = neuronsRef.current;
      const mouse = mouseRef.current;

      for (let i = 0; i < neurons.length; i++) {
        const n = neurons[i];

        // A. Wander-Verhalten (Das "freie Schwimmen")
        // Wir ändern den Winkel langsam zufällig -> organische Kurven
        n.wanderAngle += (Math.random() - 0.5) * CONFIG.wanderSpeed;
        const wanderX = Math.cos(n.wanderAngle) * CONFIG.wanderRadius;
        const wanderY = Math.sin(n.wanderAngle) * CONFIG.wanderRadius;
        
        n.vx += wanderX;
        n.vy += wanderY;

        // B. Federkraft zum Ursprung (Der "Käfig")
        const dxBase = n.baseX - n.x;
        const dyBase = n.baseY - n.y;
        n.vx += dxBase * CONFIG.springStiffness;
        n.vy += dyBase * CONFIG.springStiffness;

        // C. Maus-Interaktion (Sanftes Wegschieben oder Anziehen)
        if (mouse.active) {
          const dxMouse = mouse.x - n.x;
          const dyMouse = mouse.y - n.y;
          const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

          if (distMouse < CONFIG.mouseInteractionRadius) {
            const force = (1 - distMouse / CONFIG.mouseInteractionRadius) * CONFIG.mouseForce;
            // Wir ziehen an (positiv) - für Abstoßen einfach Vorzeichen drehen
            n.vx += dxMouse * force; 
            n.vy += dyMouse * force;
          }
        }

        // D. Physik anwenden
        n.vx *= CONFIG.damping;
        n.vy *= CONFIG.damping;
        n.x += n.vx;
        n.y += n.vy;

        // E. Flash Decay (Aufleuchten abklingen lassen)
        if (n.flash > 0) {
          n.flash -= CONFIG.flashDecay;
          if (n.flash < 0) n.flash = 0;
        }
      }
    };

    // --- 3. Rendering & Signal Logik ---
    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      
      const neurons = neuronsRef.current;
      const pulses = pulsesRef.current;

      // --- Layer 1: Statische Verbindungen ---
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(${CONFIG.baseColor}, ${CONFIG.baseOpacity})`;
      ctx.beginPath();
      for (let i = 0; i < neurons.length; i++) {
        const n = neurons[i];
        // Optimierung: Nur Verbindungen zu höheren Indices zeichnen (vermeidet doppelte Linien)
        for (const targetIdx of n.connections) {
          if (targetIdx > i) {
            const target = neurons[targetIdx];
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(target.x, target.y);
          }
        }
      }
      ctx.stroke();

      // --- Layer 2: Signale & Kettenreaktion ---
      ctx.globalCompositeOperation = "lighter"; // Licht-Effekt
      
      // Wir iterieren rückwärts, um Elemente sicher zu löschen
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i];
        const nA = neurons[p.fromIndex];
        const nB = neurons[p.toIndex];

        const dx = nB.x - nA.x;
        const dy = nB.y - nA.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        p.progress += CONFIG.signalSpeed;

        // --- HIER PASSIERT DIE MAGIE: Ziel erreicht? ---
        if (p.progress >= dist) {
          // 1. Impuls entfernen
          pulses.splice(i, 1);
          
          // 2. Ziel-Neuron aufleuchten lassen (Flash)
          nB.flash = 1.0 * p.strength; // Flash-Intensität basiert auf Signalstärke

          // 3. Kettenreaktion: Neue Impulse aussenden?
          // Nur wenn das Signal noch stark genug ist
          if (p.strength * CONFIG.signalDecay > CONFIG.minSignalStrength) {
            const newStrength = p.strength * CONFIG.signalDecay;
            
            // An alle Nachbarn weiterleiten (außer an den Absender)
            nB.connections.forEach(neighborIdx => {
              if (neighborIdx !== p.fromIndex) {
                spawnPulse(p.toIndex, neighborIdx, newStrength);
              }
            });
          }
          continue;
        }

        // Zeichnen des Impulses
        const t = p.progress / dist;
        const headX = nA.x + dx * t;
        const headY = nA.y + dy * t;
        
        // Schweif-Länge berechnen
        const tailLen = Math.min(CONFIG.signalLength / dist, t);
        const tailX = nA.x + dx * (t - tailLen);
        const tailY = nA.y + dy * (t - tailLen);

        const gradient = ctx.createLinearGradient(tailX, tailY, headX, headY);
        // Alpha basiert auf der Signalstärke (strength)
        gradient.addColorStop(0, `rgba(${CONFIG.signalColor}, 0)`);
        gradient.addColorStop(1, `rgba(${CONFIG.signalColor}, ${p.strength})`);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2 * p.strength; // Stärkere Signale sind dicker
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(headX, headY);
        ctx.stroke();
      }

      // --- Layer 3: Neuronen & Flashes ---
      for (let i = 0; i < neurons.length; i++) {
        const n = neurons[i];
        
        // Basis-Punkt
        ctx.fillStyle = `rgba(${CONFIG.baseColor}, ${0.3 + n.flash * 0.7})`; // Heller wenn Flash aktiv
        ctx.beginPath();
        ctx.arc(n.x, n.y, CONFIG.particleSize, 0, Math.PI * 2);
        ctx.fill();

        // Flash-Glow (der "Halo" um den Punkt beim Aufleuchten)
        if (n.flash > 0.01) {
          const glowRadius = CONFIG.particleSize * 2 + (n.flash * 6);
          const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, glowRadius);
          glow.addColorStop(0, `rgba(${CONFIG.signalColor}, ${n.flash})`);
          glow.addColorStop(1, `rgba(${CONFIG.signalColor}, 0)`);
          
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(n.x, n.y, glowRadius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.globalCompositeOperation = "source-over"; // Reset
    };

    const loop = () => {
      updatePhysics();
      draw();
      animationFrameId = requestAnimationFrame(loop);
    };

    // --- Events ---
    const handleResize = () => initNetwork();
    
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY, active: true };
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    const handleClick = (e: MouseEvent) => {
      const clickX = e.clientX;
      const clickY = e.clientY;
      
      // Finde das nächste Neuron
      let closestIdx = -1;
      let minDist = Infinity;
      const neurons = neuronsRef.current;
      
      for (let i = 0; i < neurons.length; i++) {
        const dx = neurons[i].x - clickX;
        const dy = neurons[i].y - clickY;
        const dist = dx * dx + dy * dy;
        
        if (dist < minDist) {
          minDist = dist;
          closestIdx = i;
        }
      }

      // Starte die Initial-Welle
      if (closestIdx !== -1 && minDist < 150 * 150) {
        const startNode = neurons[closestIdx];
        startNode.flash = 1.0; // Sofortiges Feedback am Klick
        
        startNode.connections.forEach(targetIdx => {
          spawnPulse(closestIdx, targetIdx, 1.0); // Volle Stärke (1.0)
        });
      }
    };

    initNetwork();
    loop();

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("click", handleClick);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 transition-opacity duration-1000"
      style={{
        opacity: 0.6,
        pointerEvents: "auto",
      }}
    />
  );
}