"use client";

import { useEffect, useRef } from "react";

const CONFIG = {
  neuronDensity: 0.00005,     // Reduziert für Performance
  baseSpeed: 0.15,
  signalSpeed: 8,
  maxConnections: 3,          // Reduziert für Performance
  maxPulses: 50,              // Limit für Memory Management
  connectionMaxDist: 100,     // Maximale Distanz für Verbindungen
  chargeFrames: 25,
  mouseRadius: 250,           // Magnetischer Radius
  mouseForce: 0.8,            // Stärke der magnetischen Anziehung/Abstoßung
  parallaxFactor: 0.15,       // Parallaxe-Stärke (subtiler für Eleganz)
  bloomIntensity: 0.6,         // Bloom-Effekt Stärke
  floatAmplitude: 0.5,        // Amplitude der Sine-Wave "Floating"-Bewegung
  floatSpeed: 0.0003,         // Geschwindigkeit der Floating-Bewegung
  wakeDecay: 0.92,            // Wie schnell Wake-Turbulenzen verschwinden
  damping: 0.05,              // Damping-Faktor für flüssige Bewegung (Lerp)
  clickRadius: 150,           // Radius für Click-to-Pulse
  brownianStrength: 0.08,     // Stärke der Brownian Motion
  brownianChangeRate: 0.02,   // Wie oft die Brownian-Richtung ändert
  physicsUpdateInterval: 2,   // Physics nur jeden 2. Frame
  viewportPadding: 100,       // Padding für Viewport-Culling
  propagationChance: 0.3,     // 30% Chance für weitere Pulse-Propagation
  pulseCooldownFrames: 10,    // Cooldown für Neuron nach Propagation
  baseLineOpacity: 0.08,      // Basis-Opazität für Linien (Dark Mode)
};

interface Neuron {
  x: number;
  y: number;
  z: number;              // 0 (hinten) bis 1 (vorne)
  baseX: number;          // Für Sine-Wave Floating
  baseY: number;
  targetX: number;        // Ziel-Position für Damping (Mouse-Interaktion)
  targetY: number;
  vx: number;
  vy: number;
  radius: number;
  intensity: number;
  chargeTimer: number;
  connections: number[];
  wakeX: number;          // Turbulenz von Maus-Wake
  wakeY: number;
  timeOffset: number;     // Für individuelle Sine-Wave Phase
  brownianAngle: number;  // Aktuelle Brownian-Richtung
  brownianTimer: number;  // Timer für Brownian-Richtungswechsel
  pulseCooldown: number;  // Cooldown-Timer für Pulse-Propagation
}

interface Pulse {
  from: number;
  to: number;
  progress: number;
  z: number;
  depth: number;          // Propagation-Tiefe (verhindert endlose Loops)
}

export default function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000, prevX: -1000, prevY: -1000, speed: 0 });
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
    let frameCount = 0; // Für Physics-Throttling
    let rafScheduled = false; // Für Mouse-Move Throttling

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
        const z = Math.random(); // 0 = hinten, 1 = vorne
        
        // Foreground (z > 0.8): Groß, schnell, unscharf
        // Background (z < 0.3): Klein, langsam, scharf
        const isForeground = z > 0.8;
        const isBackground = z < 0.3;
        
        const baseX = Math.random() * width;
        const baseY = Math.random() * height;
        
        neurons.push({
          x: baseX,
          y: baseY,
          z: z,
          baseX: baseX,
          baseY: baseY,
          targetX: baseX,      // Initial gleich der aktuellen Position
          targetY: baseY,
          // Speed skaliert mit Z (vorne = schneller)
          vx: (Math.random() - 0.5) * CONFIG.baseSpeed * (z * 0.8 + 0.5),
          vy: (Math.random() - 0.5) * CONFIG.baseSpeed * (z * 0.8 + 0.5),
          // Radius: Foreground groß (2-3px), Background klein (0.5-1px)
          radius: isForeground 
            ? z * 1.2 + 1.8 
            : isBackground 
            ? z * 0.5 + 0.5 
            : z * 1.5 + 0.5,
          intensity: 0,
          chargeTimer: 0,
          connections: [],
          wakeX: 0,
          wakeY: 0,
          timeOffset: Math.random() * Math.PI * 2, // Individuelle Phase
          brownianAngle: Math.random() * Math.PI * 2, // Zufällige Startrichtung
          brownianTimer: Math.random() * 100, // Zufälliger Start-Timer
          pulseCooldown: 0, // Cooldown für Pulse-Propagation
        });
      }

      // Verbindungen: Nur auf ähnlichen Z-Ebenen (3D-Logik) + Distanz-Check
      neurons.forEach((n1, i) => {
        const potentialIndices = neurons
          .map((_, idx) => idx)
          .filter(idx => {
            if (idx === i) return false;
            const n2 = neurons[idx];
            const zDiff = Math.abs(n2.z - n1.z);
            const dist = Math.hypot(n1.x - n2.x, n1.y - n2.y);
            // Verbindungen nur in ähnlicher Tiefe UND innerhalb der Max-Distanz
            return zDiff < 0.35 && dist < CONFIG.connectionMaxDist;
          })
          .sort((a, b) => {
            const distA = Math.hypot(n1.x - neurons[a].x, n1.y - neurons[a].y);
            const distB = Math.hypot(n1.x - neurons[b].x, n1.y - neurons[b].y);
            return distA - distB;
          });

        n1.connections = potentialIndices.slice(0, CONFIG.maxConnections);
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      // Throttle mit requestAnimationFrame
      if (!rafScheduled) {
        rafScheduled = true;
        requestAnimationFrame(() => {
          const prevX = mouseRef.current.x;
          const prevY = mouseRef.current.y;
          const dx = e.clientX - prevX;
          const dy = e.clientY - prevY;
          const speed = Math.hypot(dx, dy);
          
          mouseRef.current = {
            x: e.clientX,
            y: e.clientY,
            prevX,
            prevY,
            speed: Math.min(speed, 50), // Cap für Stabilität
          };
          rafScheduled = false;
        });
      }
    };

    const handleMouseClick = (e: MouseEvent) => {
      const clickX = e.clientX;
      const clickY = e.clientY;

      // NEURAL IGNITE: Finde alle Neuronen im Click-Radius
      const affectedNeurons: number[] = [];
      neurons.forEach((n, idx) => {
        const dx = n.x - clickX;
        const dy = n.y - clickY;
        const dist = Math.hypot(dx, dy);

        if (dist < CONFIG.clickRadius) {
          // Trigger Neuron: Setze Intensität und Charge
          n.intensity = 1.0;
          n.chargeTimer = CONFIG.chargeFrames;
          affectedNeurons.push(idx);
        }
      });

      // Erstelle Pulses von allen betroffenen Neuronen zu ihren Verbindungen
      // Memory Management: Limit auf maxPulses
      affectedNeurons.forEach((neuronIdx) => {
        if (pulses.length >= CONFIG.maxPulses) return; // Stop wenn Limit erreicht
        
        const neuron = neurons[neuronIdx];
        neuron.connections.forEach((targetIdx) => {
          if (pulses.length >= CONFIG.maxPulses) return; // Stop wenn Limit erreicht
          
          pulses.push({
            from: neuronIdx,
            to: targetIdx,
            progress: 0,
            z: neuron.z,
            depth: 0, // Start-Tiefe für Propagation
          });
        });
      });
    };

    const update = () => {
      timeRef.current += 16; // ~60fps
      frameCount++;
      ctx.clearRect(0, 0, width, height);
      const isDark = document.documentElement.classList.contains("dark");
      
      // Subtile Farben für Transparenz
      const neuronAlpha = isDark ? 0.08 : 0.12;
      const connectionAlpha = isDark ? CONFIG.baseLineOpacity : 0.04;
      const pulseColor = isDark ? "255, 255, 255" : "0, 0, 0";

      // THROTTLE: Physics nur jeden 2. Frame
      const shouldUpdatePhysics = frameCount % CONFIG.physicsUpdateInterval === 0;

      // 1. ORGANIC FLOW: Sine-Wave Floating für alle Neuronen
      const time = timeRef.current * CONFIG.floatSpeed;

      // 2. Parallaxe: Maus-basierte Verschiebung
      const parallaxOffsetX = (mouseRef.current.x - width / 2) * CONFIG.parallaxFactor;
      const parallaxOffsetY = (mouseRef.current.y - height / 2) * CONFIG.parallaxFactor;

      // 3. Neuronen Update & Physik (nur wenn shouldUpdatePhysics)
      neurons.forEach((n) => {
        // Viewport Culling: Skip Neuronen außerhalb des Viewports
        const viewportPadding = CONFIG.viewportPadding;
        if (n.x < -viewportPadding || n.x > width + viewportPadding ||
            n.y < -viewportPadding || n.y > height + viewportPadding) {
          // Nur Position updaten, nicht zeichnen
          if (shouldUpdatePhysics) {
            // Minimales Update für Screen Wrap
            if (n.baseX < -50) n.baseX = width + 50;
            if (n.baseX > width + 50) n.baseX = -50;
            if (n.baseY < -50) n.baseY = height + 50;
            if (n.baseY > height + 50) n.baseY = -50;
          }
          return; // Skip rest of update
        }

        if (shouldUpdatePhysics) {
          // Organic Floating: Sine-Wave Bewegung
          n.baseX += Math.sin(time + n.timeOffset) * CONFIG.floatAmplitude * (n.z + 0.3) * 0.01;
          n.baseY += Math.cos(time * 0.7 + n.timeOffset) * CONFIG.floatAmplitude * (n.z + 0.3) * 0.01;

          // BROWNIAN MOTION: Organische, zufällige Drift
          n.brownianTimer++;
          if (n.brownianTimer > 100 / CONFIG.brownianChangeRate) {
            n.brownianAngle = Math.random() * Math.PI * 2;
            n.brownianTimer = 0;
          }
          
          const brownianSpeed = CONFIG.brownianStrength * (n.z * 0.5 + 0.5);
          n.baseX += Math.cos(n.brownianAngle) * brownianSpeed;
          n.baseY += Math.sin(n.brownianAngle) * brownianSpeed;

          // Parallaxe: Tiefe-basierte Verschiebung (auf Base-Position)
          const parallaxBaseX = n.baseX + parallaxOffsetX * n.z;
          const parallaxBaseY = n.baseY + parallaxOffsetY * n.z;

          // MOUSE INTERACTION: Berechne Ziel-Position mit Damping
          const mouseDx = parallaxBaseX - mouseRef.current.x;
          const mouseDy = parallaxBaseY - mouseRef.current.y;
          const mouseDist = Math.hypot(mouseDx, mouseDy);

          if (mouseDist < CONFIG.mouseRadius && mouseDist > 0) {
            const force = (1 - mouseDist / CONFIG.mouseRadius) * CONFIG.mouseForce;
            const angle = Math.atan2(mouseDy, mouseDx);
            
            // Setze Ziel-Position (Abstoßung) - flieht von Maus
            n.targetX = parallaxBaseX + Math.cos(angle) * force * 3 * n.z;
            n.targetY = parallaxBaseY + Math.sin(angle) * force * 3 * n.z;
          } else {
            // Keine Maus-Interaktion: Ziel = Base-Position mit Parallaxe
            n.targetX = parallaxBaseX;
            n.targetY = parallaxBaseY;
          }

          // Wake-Effekt: Wenn Maus sich schnell bewegt, erzeuge Turbulenzen
          const wakeDx = n.x - mouseRef.current.x;
          const wakeDy = n.y - mouseRef.current.y;
          const wakeDist = Math.hypot(wakeDx, wakeDy);

          if (wakeDist < CONFIG.mouseRadius && wakeDist > 0 && mouseRef.current.speed > 5) {
            const force = (1 - wakeDist / CONFIG.mouseRadius) * CONFIG.mouseForce;
            const angle = Math.atan2(wakeDy, wakeDx);
            const wakeForce = (mouseRef.current.speed / 50) * (1 - wakeDist / CONFIG.mouseRadius);
            // Perpendicular Wake (wie Boot-Wake)
            const perpAngle = angle + Math.PI / 2;
            n.wakeX += Math.cos(perpAngle) * wakeForce * 0.5;
            n.wakeY += Math.sin(perpAngle) * wakeForce * 0.5;

            // Intensität für Glow
            n.intensity = Math.max(n.intensity, force * 0.8 * n.z);
          }

          // Wake-Decay
          n.wakeX *= CONFIG.wakeDecay;
          n.wakeY *= CONFIG.wakeDecay;
        }

        // DAMPING: Flüssige Bewegung zu Ziel-Position (Lerp) - IMMER updaten für smoothness
        const dampingFactor = CONFIG.damping * (n.z * 0.5 + 0.5); // Vorne = schnelleres Damping
        n.x += (n.targetX - n.x) * dampingFactor;
        n.y += (n.targetY - n.y) * dampingFactor;
        n.x += n.wakeX;
        n.y += n.wakeY;

        // Screen Wrap
        if (n.baseX < -50) n.baseX = width + 50;
        if (n.baseX > width + 50) n.baseX = -50;
        if (n.baseY < -50) n.baseY = height + 50;
        if (n.baseY > height + 50) n.baseY = -50;
      });

      // 4. GLOW-PATHS: Verbindungen UNTER den Neuronen (sichtbare Architektur)
      neurons.forEach((n) => {
        // Viewport Culling: Skip wenn Neuron außerhalb
        const viewportPadding = CONFIG.viewportPadding;
        if (n.x < -viewportPadding || n.x > width + viewportPadding ||
            n.y < -viewportPadding || n.y > height + viewportPadding) {
          return;
        }

        n.connections.forEach((targetIdx) => {
          const target = neurons[targetIdx];
          const dist = Math.hypot(n.x - target.x, n.y - target.y);
          
          // Distanz-Check: Nur zeichnen wenn innerhalb connectionMaxDist
          if (dist < CONFIG.connectionMaxDist) {
            const zAvg = (n.z + target.z) / 2;
            const isActive = n.chargeTimer > 0 || target.chargeTimer > 0 || 
                           n.intensity > 0.15 || target.intensity > 0.15;
            
            if (isActive) {
              // Glow-Path für aktive Verbindungen
              ctx.save();
              ctx.strokeStyle = isDark 
                ? `rgba(255, 255, 255, ${0.25 * zAvg})` 
                : `rgba(0, 0, 0, ${0.25 * zAvg})`;
              ctx.lineWidth = 0.8 + zAvg * 0.5;
              ctx.setLineDash([]); // Solide Linie für aktive Signale
              ctx.beginPath();
              ctx.moveTo(n.x, n.y);
              ctx.lineTo(target.x, target.y);
              ctx.stroke();
              ctx.restore();
            } else {
              // Sichtbare Basis-Verbindungen mit technischem Look
              ctx.save();
              ctx.beginPath();
              ctx.strokeStyle = isDark 
                ? `rgba(255, 255, 255, ${connectionAlpha * zAvg})` 
                : `rgba(0, 0, 0, ${connectionAlpha * zAvg})`;
              ctx.lineWidth = 0.5; // Delikater, technischer Look
              ctx.setLineDash([2, 4]); // Gestrichelte Linie für inaktive Verbindungen
              ctx.moveTo(n.x, n.y);
              ctx.lineTo(target.x, target.y);
              ctx.stroke();
              ctx.restore();
            }
          }
        });
      });

      // 5. BLOOM & GLOW: Aktive Neuronen ÜBER den Linien (OHNE shadowBlur für Performance)
      neurons.forEach((n) => {
        // Viewport Culling: Skip Neuronen außerhalb
        const viewportPadding = CONFIG.viewportPadding;
        if (n.x < -viewportPadding || n.x > width + viewportPadding ||
            n.y < -viewportPadding || n.y > height + viewportPadding) {
          // Minimales Update auch außerhalb
          if (n.chargeTimer > 0) n.chargeTimer--;
          n.intensity *= 0.93;
          if (n.pulseCooldown > 0) n.pulseCooldown--;
          return;
        }

        const isActive = n.chargeTimer > 0 || n.intensity > 0.1;
        
        if (isActive) {
          // Bloom-Effekt: Radialer Gradient OHNE Screen-Blend (Performance)
          const gradient = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.radius * 3);
          const bloomAlpha = n.intensity * CONFIG.bloomIntensity * n.z;
          gradient.addColorStop(0, isDark 
            ? `rgba(255, 255, 255, ${bloomAlpha * 0.4})` 
            : `rgba(0, 0, 0, ${bloomAlpha * 0.4})`);
          gradient.addColorStop(0.5, isDark 
            ? `rgba(255, 255, 255, ${bloomAlpha * 0.1})` 
            : `rgba(0, 0, 0, ${bloomAlpha * 0.1})`);
          gradient.addColorStop(1, "transparent");
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.radius * 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Neuron Core
        ctx.beginPath();
        const alpha = n.chargeTimer > 0 
          ? Math.min(n.intensity + 0.3, 0.6) * n.z
          : neuronAlpha * (0.7 + n.z * 0.3);
        ctx.fillStyle = `rgba(${pulseColor}, ${alpha})`;
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fill();

        if (n.chargeTimer > 0) n.chargeTimer--;
        n.intensity *= 0.93;
        // Cooldown für Pulse-Propagation
        if (n.pulseCooldown > 0) n.pulseCooldown--;
      });

      // 6. SIGNALE / PULSE mit Core & Halo (High-End Glow ohne shadowBlur)
      if (Math.random() < 0.04 && pulses.length < CONFIG.maxPulses) {
        const start = Math.floor(Math.random() * neurons.length);
        const connections = neurons[start].connections;
        if (connections.length > 0) {
          pulses.push({
            from: start,
            to: connections[Math.floor(Math.random() * connections.length)],
            progress: 0,
            z: neurons[start].z,
            depth: 0, // Start-Tiefe
          });
        }
      }

      pulses = pulses.filter((p) => {
        p.progress += (CONFIG.signalSpeed / 1000) * (p.z + 0.5);
        
        if (p.progress >= 1) {
          // Pulse erreicht Ziel: Trigger Neuron und mögliche Propagation
          const target = neurons[p.to];
          if (target) {
            target.chargeTimer = CONFIG.chargeFrames;
            target.intensity = 1;
            
            // ORGANISCHE PROPAGATION: 30% Chance für weitere Pulses
            if (target.pulseCooldown === 0 && 
                p.depth < 5 && // Max-Tiefe verhindert endlose Loops
                Math.random() < CONFIG.propagationChance &&
                pulses.length < CONFIG.maxPulses) {
              
              // Setze Cooldown
              target.pulseCooldown = CONFIG.pulseCooldownFrames;
              
              // Erstelle Pulses zu allen Verbindungen
              target.connections.forEach((targetIdx) => {
                if (pulses.length >= CONFIG.maxPulses) return;
                
                pulses.push({
                  from: p.to,
                  to: targetIdx,
                  progress: 0,
                  z: target.z,
                  depth: p.depth + 1, // Erhöhe Tiefe
                });
              });
            }
          }
          return false; // Entferne Pulse sofort (Performance)
        }

        const n1 = neurons[p.from];
        const n2 = neurons[p.to];
        if (!n1 || !n2) return false;

        const curX = n1.x + (n2.x - n1.x) * p.progress;
        const curY = n1.y + (n2.y - n1.y) * p.progress;

        // Viewport Culling für Pulses
        const viewportPadding = CONFIG.viewportPadding;
        if (curX < -viewportPadding || curX > width + viewportPadding ||
            curY < -viewportPadding || curY > height + viewportPadding) {
          return true; // Weiter updaten, aber nicht zeichnen
        }

        // CORE & HALO: High-End Glow ohne shadowBlur
        ctx.save();
        
        // Halo: Größerer, semi-transparenter Kreis (4px)
        ctx.beginPath();
        ctx.fillStyle = isDark 
          ? `rgba(255, 255, 255, ${0.3 * p.z})` 
          : `rgba(0, 0, 0, ${0.3 * p.z})`;
        ctx.arc(curX, curY, 4 * p.z, 0, Math.PI * 2);
        ctx.fill();
        
        // Core: Kleiner, heller weißer Punkt (1.5px)
        ctx.beginPath();
        ctx.fillStyle = isDark 
          ? `rgba(255, 255, 255, ${0.95 * p.z})` 
          : `rgba(0, 0, 0, ${0.95 * p.z})`;
        ctx.arc(curX, curY, 1.5 * p.z, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();

        return true;
      });

      animationFrameId = requestAnimationFrame(update);
    };

    init();
    update();
    window.addEventListener("resize", init);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseClick);

    return () => {
      window.removeEventListener("resize", init);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseClick);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 transition-opacity duration-1000"
      style={{
        opacity: 1,
        willChange: "transform",
        imageRendering: "crisp-edges",
        pointerEvents: "auto", // Aktiviert für Click-Interaktion
      }}
    />
  );
}