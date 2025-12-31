"use client";

import { useEffect, useRef } from "react";

const CONFIG = {
  neuronDensity: 0.00012, // Erhöht für mehr Dichte
  baseSpeed: 0.15,
  signalSpeed: 8,
  maxConnections: 5,
  chargeFrames: 25,
  mouseRadius: 250,           // Magnetischer Radius
  mouseForce: 0.8,            // Stärke der magnetischen Anziehung/Abstoßung
  parallaxFactor: 0.15,       // Parallaxe-Stärke (subtiler für Eleganz)
  bloomIntensity: 0.6,        // Bloom-Effekt Stärke
  floatAmplitude: 0.5,        // Amplitude der Sine-Wave "Floating"-Bewegung
  floatSpeed: 0.0003,         // Geschwindigkeit der Floating-Bewegung
  wakeDecay: 0.92,            // Wie schnell Wake-Turbulenzen verschwinden
};

interface Neuron {
  x: number;
  y: number;
  z: number;              // 0 (hinten) bis 1 (vorne)
  baseX: number;          // Für Sine-Wave Floating
  baseY: number;
  vx: number;
  vy: number;
  radius: number;
  intensity: number;
  chargeTimer: number;
  connections: number[];
  wakeX: number;          // Turbulenz von Maus-Wake
  wakeY: number;
  timeOffset: number;     // Für individuelle Sine-Wave Phase
}

interface Pulse {
  from: number;
  to: number;
  progress: number;
  z: number;
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
        });
      }

      // Verbindungen: Nur auf ähnlichen Z-Ebenen (3D-Logik)
      neurons.forEach((n1, i) => {
        const potentialIndices = neurons
          .map((_, idx) => idx)
          .filter(idx => {
            if (idx === i) return false;
            const n2 = neurons[idx];
            const zDiff = Math.abs(n2.z - n1.z);
            return zDiff < 0.35; // Verbindungen nur in ähnlicher Tiefe
          })
          .sort((a, b) => {
            const distA = Math.hypot(n1.x - neurons[a].x, n1.y - neurons[a].y);
            const distB = Math.hypot(n1.x - neurons[b].x, n1.y - neurons[b].y);
            return distA - distB;
          });

        n1.connections = potentialIndices.slice(0, Math.floor(Math.random() * 3) + 2);
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
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
    };

    const update = () => {
      timeRef.current += 16; // ~60fps
      ctx.clearRect(0, 0, width, height);
      const isDark = document.documentElement.classList.contains("dark");
      
      // Subtile Farben für Transparenz
      const neuronAlpha = isDark ? 0.08 : 0.12;
      const connectionAlpha = isDark ? 0.02 : 0.04;
      const pulseColor = isDark ? "255, 255, 255" : "0, 0, 0";

      // 1. ORGANIC FLOW: Sine-Wave Floating für alle Neuronen
      const time = timeRef.current * CONFIG.floatSpeed;

      // 2. Parallaxe: Maus-basierte Verschiebung
      const parallaxOffsetX = (mouseRef.current.x - width / 2) * CONFIG.parallaxFactor;
      const parallaxOffsetY = (mouseRef.current.y - height / 2) * CONFIG.parallaxFactor;

      // 3. Neuronen Update & Physik
      neurons.forEach((n) => {
        // Organic Floating: Sine-Wave Bewegung
        n.x = n.baseX + Math.sin(time + n.timeOffset) * CONFIG.floatAmplitude * (n.z + 0.3);
        n.y = n.baseY + Math.cos(time * 0.7 + n.timeOffset) * CONFIG.floatAmplitude * (n.z + 0.3);

        // Parallaxe: Tiefe-basierte Verschiebung
        n.x += parallaxOffsetX * n.z;
        n.y += parallaxOffsetY * n.z;

        // Base Movement (langsam driftend)
        n.x += n.vx;
        n.y += n.vy;

        // MAGNETIC PHYSICS: Maus-Interaktion mit Wake-Effekt
        const dx = n.x - mouseRef.current.x;
        const dy = n.y - mouseRef.current.y;
        const dist = Math.hypot(dx, dy);

        if (dist < CONFIG.mouseRadius && dist > 0) {
          const force = (1 - dist / CONFIG.mouseRadius) * CONFIG.mouseForce;
          const angle = Math.atan2(dy, dx);
          
          // Abstoßung (neurons fliehen vor Maus)
          n.x += Math.cos(angle) * force * 3 * n.z;
          n.y += Math.sin(angle) * force * 3 * n.z;

          // Wake-Effekt: Wenn Maus sich schnell bewegt, erzeuge Turbulenzen
          if (mouseRef.current.speed > 5) {
            const wakeForce = (mouseRef.current.speed / 50) * (1 - dist / CONFIG.mouseRadius);
            // Perpendicular Wake (wie Boot-Wake)
            const perpAngle = angle + Math.PI / 2;
            n.wakeX += Math.cos(perpAngle) * wakeForce * 0.5;
            n.wakeY += Math.sin(perpAngle) * wakeForce * 0.5;
          }

          // Intensität für Glow
          n.intensity = Math.max(n.intensity, force * 0.8 * n.z);
        }

        // Wake-Decay
        n.wakeX *= CONFIG.wakeDecay;
        n.wakeY *= CONFIG.wakeDecay;
        n.x += n.wakeX;
        n.y += n.wakeY;

        // Screen Wrap
        if (n.x < -50) n.baseX = width + 50;
        if (n.x > width + 50) n.baseX = -50;
        if (n.y < -50) n.baseY = height + 50;
        if (n.y > height + 50) n.baseY = -50;
      });

      // 4. BLOOM & GLOW: Aktive Neuronen mit radialem Gradient
      neurons.forEach((n) => {
        const isActive = n.chargeTimer > 0 || n.intensity > 0.1;
        
        if (isActive) {
          // Bloom-Effekt: Radialer Gradient
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
      });

      // 5. GLOW-PATHS: Verbindungen mit Shadow-Blur für Energie-Pulse
      neurons.forEach((n) => {
        n.connections.forEach((targetIdx) => {
          const target = neurons[targetIdx];
          const dist = Math.hypot(n.x - target.x, n.y - target.y);
          
          if (dist < 180) {
            const zAvg = (n.z + target.z) / 2;
            const isActive = n.chargeTimer > 0 || target.chargeTimer > 0 || 
                           n.intensity > 0.15 || target.intensity > 0.15;
            
            if (isActive) {
              // Glow-Path für aktive Verbindungen
              ctx.save();
              ctx.strokeStyle = isDark 
                ? `rgba(255, 255, 255, ${0.15 * zAvg})` 
                : `rgba(0, 0, 0, ${0.15 * zAvg})`;
              ctx.shadowBlur = 8 * zAvg;
              ctx.shadowColor = isDark 
                ? `rgba(255, 255, 255, ${0.6 * zAvg})` 
                : `rgba(0, 0, 0, ${0.6 * zAvg})`;
              ctx.lineWidth = 0.5 + zAvg * 0.5;
              ctx.beginPath();
              ctx.moveTo(n.x, n.y);
              ctx.lineTo(target.x, target.y);
              ctx.stroke();
              ctx.restore();
            } else {
              // Subtile Verbindungen (ohne Glow)
              ctx.beginPath();
              ctx.strokeStyle = isDark 
                ? `rgba(255, 255, 255, ${connectionAlpha * zAvg})` 
                : `rgba(0, 0, 0, ${connectionAlpha * zAvg})`;
              ctx.lineWidth = 0.3;
              ctx.moveTo(n.x, n.y);
              ctx.lineTo(target.x, target.y);
              ctx.stroke();
            }
          }
        });
      });

      // 6. SIGNALE / PULSE mit Glow-Effekt
      if (Math.random() < 0.04) {
        const start = Math.floor(Math.random() * neurons.length);
        const connections = neurons[start].connections;
        if (connections.length > 0) {
          pulses.push({
            from: start,
            to: connections[Math.floor(Math.random() * connections.length)],
            progress: 0,
            z: neurons[start].z,
          });
        }
      }

      pulses = pulses.filter((p) => {
        p.progress += (CONFIG.signalSpeed / 1000) * (p.z + 0.5);
        
        if (p.progress >= 1) {
          const target = neurons[p.to];
          if (target) {
            target.chargeTimer = CONFIG.chargeFrames;
            target.intensity = 1;
          }
          return false;
        }

        const n1 = neurons[p.from];
        const n2 = neurons[p.to];
        if (!n1 || !n2) return false;

        const curX = n1.x + (n2.x - n1.x) * p.progress;
        const curY = n1.y + (n2.y - n1.y) * p.progress;

        // Glowing Pulse
        ctx.save();
        ctx.shadowBlur = 12 * p.z;
        ctx.shadowColor = isDark 
          ? `rgba(255, 255, 255, ${0.8 * p.z})` 
          : `rgba(0, 0, 0, ${0.8 * p.z})`;
        ctx.beginPath();
        ctx.fillStyle = `rgba(${pulseColor}, ${0.9 * p.z})`;
        ctx.arc(curX, curY, 1.5 * p.z + 0.8, 0, Math.PI * 2);
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
      style={{
        opacity: 1,
        willChange: "transform",
        imageRendering: "crisp-edges",
      }}
    />
  );
}