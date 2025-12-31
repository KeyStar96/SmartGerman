"use client";

import { useEffect, useRef } from "react";

const CONFIG = {
  neuronDensity: 0.00006,
  signalSpeed: 0.018,          // ~55 Frames pro Hop
  maxConnections: 5,
  maxPulses: 120,
  connectionMaxDist: 180,
  chargeFrames: 40,
  mouseRadius: 120,
  mouseForce: 0.25,
  clickRadius: 80,
  floatAmplitude: 0.2,
  floatSpeed: 0.0002,
  damping: 0.03,
  baseLineOpacity: 0.06,       // Sehr dimme Basis-Linien
  signalDecayPerHop: 0.7,      // 70% der Intensität bleiben pro Hop
  minIntensity: 0.12,          // Minimale Intensität für Weiterleitung
  autoSpawnChance: 0.025,      // Chance für zufälligen Pulse pro Frame
};

interface Neuron {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  targetX: number;
  targetY: number;
  radius: number;
  intensity: number;
  chargeTimer: number;
  connections: number[];
  timeOffset: number;
}

interface Pulse {
  from: number;
  to: number;
  progress: number;
  intensity: number;
}

export default function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let neurons: Neuron[] = [];
    let pulses: Pulse[] = [];
    let animationFrameId: number;

    const init = () => {
      const dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      neurons = [];
      pulses = [];
      const area = width * height;
      const count = Math.floor(area * CONFIG.neuronDensity);

      for (let i = 0; i < count; i++) {
        const baseX = Math.random() * width;
        const baseY = Math.random() * height;
        
        neurons.push({
          x: baseX,
          y: baseY,
          baseX,
          baseY,
          targetX: baseX,
          targetY: baseY,
          radius: 1.2 + Math.random() * 1.3,
          intensity: 0,
          chargeTimer: 0,
          connections: [],
          timeOffset: Math.random() * Math.PI * 2,
        });
      }

      // Verbindungen basierend auf Distanz
      neurons.forEach((n1, i) => {
        const sorted = neurons
          .map((n2, idx) => ({ idx, dist: Math.hypot(n1.x - n2.x, n1.y - n2.y) }))
          .filter(({ idx, dist }) => idx !== i && dist < CONFIG.connectionMaxDist)
          .sort((a, b) => a.dist - b.dist);

        n1.connections = sorted.slice(0, CONFIG.maxConnections).map(s => s.idx);
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseClick = (e: MouseEvent) => {
      const mouseX = e.clientX;
      const mouseY = e.clientY;

      // Finde nächstes Neuron
      let nearestIdx = -1;
      let minDist = CONFIG.clickRadius;

      neurons.forEach((n, index) => {
        const dist = Math.hypot(n.x - mouseX, n.y - mouseY);
        if (dist < minDist) {
          minDist = dist;
          nearestIdx = index;
        }
      });

      if (nearestIdx !== -1) {
        triggerNeuron(nearestIdx, 1.0);
      }
    };

    // Neuron aktivieren und Pulses zu allen Verbindungen starten
    const triggerNeuron = (neuronIdx: number, intensity: number) => {
      const n = neurons[neuronIdx];
      if (!n || intensity < CONFIG.minIntensity) return;

      n.intensity = intensity;
      n.chargeTimer = CONFIG.chargeFrames;

      // Pulse zu allen Verbindungen starten
      n.connections.forEach((targetIdx) => {
        if (pulses.length < CONFIG.maxPulses) {
          // Prüfe ob bereits ein Pulse auf dieser Verbindung läuft
          const existing = pulses.find(p => 
            (p.from === neuronIdx && p.to === targetIdx) ||
            (p.from === targetIdx && p.to === neuronIdx)
          );
          if (!existing) {
            pulses.push({
              from: neuronIdx,
              to: targetIdx,
              progress: 0,
              intensity: intensity,
            });
          }
        }
      });
    };

    const update = () => {
      timeRef.current += 16;
      ctx.clearRect(0, 0, width, height);
      
      const isDark = document.documentElement.classList.contains("dark");
      const baseColor = isDark ? "255, 255, 255" : "0, 0, 0";
      const time = timeRef.current * CONFIG.floatSpeed;

      // === 1. NEURONEN PHYSICS ===
      neurons.forEach((n) => {
        // Organisches Floating
        const floatX = Math.sin(time + n.timeOffset) * CONFIG.floatAmplitude;
        const floatY = Math.cos(time * 0.7 + n.timeOffset) * CONFIG.floatAmplitude;
        
        let targetX = n.baseX + floatX;
        let targetY = n.baseY + floatY;

        // Maus-Abstoßung
        const dx = targetX - mouseRef.current.x;
        const dy = targetY - mouseRef.current.y;
        const dist = Math.hypot(dx, dy);

        if (dist < CONFIG.mouseRadius && dist > 0) {
          const force = (1 - dist / CONFIG.mouseRadius) * CONFIG.mouseForce;
          const angle = Math.atan2(dy, dx);
          targetX += Math.cos(angle) * force * 20;
          targetY += Math.sin(angle) * force * 20;
        }

        n.targetX = targetX;
        n.targetY = targetY;

        // Smooth Damping
        n.x += (n.targetX - n.x) * CONFIG.damping;
        n.y += (n.targetY - n.y) * CONFIG.damping;

        // Screen Wrap für baseX/baseY
        if (n.baseX < -50) n.baseX = width + 50;
        if (n.baseX > width + 50) n.baseX = -50;
        if (n.baseY < -50) n.baseY = height + 50;
        if (n.baseY > height + 50) n.baseY = -50;

        // Intensity Decay
        n.intensity *= 0.94;
        if (n.chargeTimer > 0) n.chargeTimer--;
      });

      // === 2. VERBINDUNGEN ZEICHNEN (nur Basis-Linien, keine aktiven Pulses) ===
      // Sammle alle Verbindungen mit aktivem Pulse
      const activePulseConnections = new Set<string>();
      pulses.forEach(p => {
        const key1 = `${p.from}-${p.to}`;
        const key2 = `${p.to}-${p.from}`;
        activePulseConnections.add(key1);
        activePulseConnections.add(key2);
      });

      neurons.forEach((n, nIdx) => {
        n.connections.forEach((targetIdx) => {
          const target = neurons[targetIdx];
          const dist = Math.hypot(n.x - target.x, n.y - target.y);
          
          if (dist < CONFIG.connectionMaxDist) {
            const key = `${nIdx}-${targetIdx}`;
            
            // Nur Basis-Linien zeichnen wenn KEIN Pulse aktiv ist
            if (!activePulseConnections.has(key)) {
              ctx.beginPath();
              ctx.strokeStyle = `rgba(${baseColor}, ${CONFIG.baseLineOpacity})`;
              ctx.lineWidth = 0.5;
              ctx.setLineDash([2, 4]);
              ctx.moveTo(n.x, n.y);
              ctx.lineTo(target.x, target.y);
              ctx.stroke();
            }
          }
        });
      });

      // === 3. PULSES VERARBEITEN & ZEICHNEN ===
      // Zufällige neue Pulses spawnen
      if (Math.random() < CONFIG.autoSpawnChance && pulses.length < CONFIG.maxPulses / 2) {
        const startIdx = Math.floor(Math.random() * neurons.length);
        if (neurons[startIdx].connections.length > 0) {
          triggerNeuron(startIdx, 1.0);
        }
      }

      const newPulses: Pulse[] = [];

      pulses = pulses.filter((p) => {
        p.progress += CONFIG.signalSpeed;

        const n1 = neurons[p.from];
        const n2 = neurons[p.to];
        if (!n1 || !n2) return false;

        // Berechne aktuelle Pulse-Position
        const curX = n1.x + (n2.x - n1.x) * p.progress;
        const curY = n1.y + (n2.y - n1.y) * p.progress;

        // === FOLLOW-THE-SIGNAL: Nur die Linie HINTER dem Pulse leuchtet ===
        // Gradient von Start (dunkel) bis Pulse-Position (hell)
        const traceAlpha = p.intensity;
        const startAlpha = traceAlpha * 0.2;
        const endAlpha = traceAlpha * 0.7;
        
        const gradient = ctx.createLinearGradient(n1.x, n1.y, curX, curY);
        gradient.addColorStop(0, `rgba(${baseColor}, ${startAlpha})`);
        gradient.addColorStop(1, `rgba(${baseColor}, ${endAlpha})`);
        
        ctx.beginPath();
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 0.8 + p.intensity * 0.7;
        ctx.setLineDash([]);
        ctx.moveTo(n1.x, n1.y);
        ctx.lineTo(curX, curY);
        ctx.stroke();

        // Pulse-Kopf (der leuchtende Punkt)
        ctx.beginPath();
        const coreAlpha = Math.min(0.95, p.intensity * 0.9);
        ctx.fillStyle = `rgba(${baseColor}, ${coreAlpha})`;
        ctx.arc(curX, curY, 2 + p.intensity * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Halo um den Pulse
        ctx.beginPath();
        ctx.fillStyle = `rgba(${baseColor}, ${p.intensity * 0.15})`;
        ctx.arc(curX, curY, 4 + p.intensity * 3, 0, Math.PI * 2);
        ctx.fill();

        // === PULSE ERREICHT ZIEL ===
        if (p.progress >= 1) {
          const nextIntensity = p.intensity * CONFIG.signalDecayPerHop;
          
          // Nur weiterleiten wenn Intensität über Minimum
          if (nextIntensity > CONFIG.minIntensity) {
            const targetNeuron = neurons[p.to];
            targetNeuron.intensity = nextIntensity;
            targetNeuron.chargeTimer = CONFIG.chargeFrames;

            // Pulses zu allen Verbindungen des Ziel-Neurons starten
            targetNeuron.connections.forEach((nextTargetIdx) => {
              // Nicht zurück zum Ursprung senden
              if (nextTargetIdx !== p.from && newPulses.length + pulses.length < CONFIG.maxPulses) {
                // Prüfe ob bereits ein Pulse existiert
                const alreadyExists = pulses.some(existing => 
                  (existing.from === p.to && existing.to === nextTargetIdx) ||
                  (existing.from === nextTargetIdx && existing.to === p.to)
                ) || newPulses.some(existing =>
                  (existing.from === p.to && existing.to === nextTargetIdx) ||
                  (existing.from === nextTargetIdx && existing.to === p.to)
                );

                if (!alreadyExists) {
                  newPulses.push({
                    from: p.to,
                    to: nextTargetIdx,
                    progress: 0,
                    intensity: nextIntensity,
                  });
                }
              }
            });
          }
          return false; // Pulse entfernen
        }

        return true;
      });

      // Neue Pulses hinzufügen
      pulses.push(...newPulses);

      // === 4. NEURONEN ZEICHNEN ===
      neurons.forEach((n) => {
        const isActive = n.chargeTimer > 0 || n.intensity > 0.1;
        
        if (isActive) {
          // Glow für aktive Neuronen
          const gradient = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.radius * 4);
          const glowAlpha = n.intensity * 0.4;
          gradient.addColorStop(0, `rgba(${baseColor}, ${glowAlpha})`);
          gradient.addColorStop(0.5, `rgba(${baseColor}, ${glowAlpha * 0.3})`);
          gradient.addColorStop(1, "transparent");
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.radius * 4, 0, Math.PI * 2);
          ctx.fill();
        }

        // Neuron Core
        ctx.beginPath();
        const alpha = isActive 
          ? Math.min(n.intensity + 0.25, 0.7)
          : 0.12;
        ctx.fillStyle = `rgba(${baseColor}, ${alpha})`;
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(update);
    };

    init();
    update();
    
    window.addEventListener("resize", init);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("click", handleMouseClick);

    return () => {
      window.removeEventListener("resize", init);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleMouseClick);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10"
      style={{
        opacity: 1,
        willChange: "transform",
        pointerEvents: "auto",
      }}
    />
  );
}
