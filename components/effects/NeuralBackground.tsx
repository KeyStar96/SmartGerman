"use client";

import { useEffect, useRef } from "react";

const CONFIG = {
  neuronDensity: 0.00007,
  baseSpeed: 0.15,
  signalSpeed: 0.0167,       // ~1 Sekunde pro Hop (60 Frames: 1/60)
  maxConnections: 6,
  maxPulses: 80,
  connectionMaxDist: 160,
  chargeFrames: 30,
  mouseRadius: 200,           // Reduziert von 250 → weniger "Flucht"
  mouseForce: 0.4,            // Reduziert von 0.8 → sanftere Bewegung
  parallaxFactor: 0.08,       // Reduziert von 0.15 → weniger Verschiebung
  bloomIntensity: 0.6,
  floatAmplitude: 0.3,        // Reduziert von 0.5 → weniger Drift
  floatSpeed: 0.0003,
  wakeDecay: 0.92,
  damping: 0.05,
  clickRadius: 80,            // Reduziert von 100 → präzisere Treffer
  brownianStrength: 0.05,     // Reduziert von 0.08 → weniger Zufalls-Bewegung
  brownianChangeRate: 0.02,
  physicsUpdateInterval: 2,
  viewportPadding: 100,
  propagationChance: 0.7,
  pulseCooldownFrames: 10,
  baseLineOpacity: 0.05,
  lineBreathSpeed: 0.002,
  lineBreathAmplitude: 0.02,
  signalDecay: 0.35,
  minIntensity: 0.15,
  maxPropagationDepth: 4,
};

interface Neuron {
  x: number;
  y: number;
  z: number;
  baseX: number;
  baseY: number;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
  radius: number;
  intensity: number;
  chargeTimer: number;
  connections: number[];
  wakeX: number;
  wakeY: number;
  timeOffset: number;
  brownianAngle: number;
  brownianTimer: number;
  pulseCooldown: number;
}

interface Pulse {
  from: number;
  to: number;
  progress: number;
  z: number;
  depth: number;
  intensity: number;
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
    let frameCount = 0;
    let rafScheduled = false;

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
        // Z-Werte zwischen 0.2-0.9 statt 0-1 für weniger extreme Parallaxe
        const z = 0.2 + Math.random() * 0.7;
        const isForeground = z > 0.75;
        const isBackground = z < 0.4;
        const baseX = Math.random() * width;
        const baseY = Math.random() * height;
        
        neurons.push({
          x: baseX,
          y: baseY,
          z: z,
          baseX: baseX,
          baseY: baseY,
          targetX: baseX,
          targetY: baseY,
          vx: (Math.random() - 0.5) * CONFIG.baseSpeed * (z * 0.8 + 0.5),
          vy: (Math.random() - 0.5) * CONFIG.baseSpeed * (z * 0.8 + 0.5),
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
          timeOffset: Math.random() * Math.PI * 2,
          brownianAngle: Math.random() * Math.PI * 2,
          brownianTimer: Math.random() * 100,
          pulseCooldown: 0,
        });
      }

      neurons.forEach((n1, i) => {
        const potentialIndices = neurons
          .map((_, idx) => idx)
          .filter(idx => {
            if (idx === i) return false;
            const n2 = neurons[idx];
            const zDiff = Math.abs(n2.z - n1.z);
            const dist = Math.hypot(n1.x - n2.x, n1.y - n2.y);
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
      if (!rafScheduled) {
        rafScheduled = true;
        requestAnimationFrame(() => {
          const rect = canvas.getBoundingClientRect();
          const prevX = mouseRef.current.x;
          const prevY = mouseRef.current.y;
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;
          const dx = mouseX - prevX;
          const dy = mouseY - prevY;
          const speed = Math.hypot(dx, dy);
          
          mouseRef.current = {
            x: mouseX,
            y: mouseY,
            prevX,
            prevY,
            speed: Math.min(speed, 50),
          };
          rafScheduled = false;
        });
      }
    };

    const handleMouseClick = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
    
      const rect = canvas.getBoundingClientRect();
      const scrollY = window.scrollY;
    
      // Maus-Position im Viewport
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
    
      let nearestNeuronIndex = -1;
      let minDist = CONFIG.clickRadius;
    
      neurons.forEach((n, index) => {
        // Die Neuronen werden mit ihrer FINALEN Position gezeichnet (nach Damping/Parallaxe)
        // Wir müssen die EXAKT GLEICHE Position wie beim Zeichnen verwenden
        const visualY = n.y - scrollY;
    
        const dx = n.x - mouseX;
        const dy = visualY - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
    
        if (dist < minDist) {
          minDist = dist;
          nearestNeuronIndex = index;
        }
      });
    
      if (nearestNeuronIndex !== -1) {
        const n = neurons[nearestNeuronIndex];
        console.log(`🎯 Treffer! Neuron ${nearestNeuronIndex} bei (${n.x.toFixed(0)}, ${n.y.toFixed(0)}), Distanz: ${minDist.toFixed(1)}px`);
        
        // Ursprungs-Neuron aktivieren
        n.intensity = 1.0;
        n.chargeTimer = CONFIG.chargeFrames;
        
        // Pulse zu ALLEN Verbindungen starten
        n.connections.forEach((targetIdx) => {
          if (pulses.length < CONFIG.maxPulses) {
            pulses.push({
              from: nearestNeuronIndex,
              to: targetIdx,
              progress: 0,
              z: n.z,
              depth: 0,
              intensity: 1.0,
            });
          }
        });
      }
    };

    const update = () => {
      timeRef.current += 16;
      frameCount++;
      ctx.clearRect(0, 0, width, height);
      const isDark = document.documentElement.classList.contains("dark");
      
      const neuronAlpha = isDark ? 0.08 : 0.12;
      const connectionAlpha = isDark ? CONFIG.baseLineOpacity : 0.05;
      const pulseColor = isDark ? "255, 255, 255" : "0, 0, 0";

      const shouldUpdatePhysics = frameCount % CONFIG.physicsUpdateInterval === 0;
      const time = timeRef.current * CONFIG.floatSpeed;
      const breathOffset = Math.sin(timeRef.current * CONFIG.lineBreathSpeed) * CONFIG.lineBreathAmplitude;
      const parallaxOffsetX = (mouseRef.current.x - width / 2) * CONFIG.parallaxFactor;
      const parallaxOffsetY = (mouseRef.current.y - height / 2) * CONFIG.parallaxFactor;
      const scrollY = window.scrollY;

      // Neuronen Update
      neurons.forEach((n) => {
        const viewportPadding = CONFIG.viewportPadding;
        const visualY = n.y - scrollY;
        
        if (n.x < -viewportPadding || n.x > width + viewportPadding ||
            visualY < -viewportPadding || visualY > height + viewportPadding) {
          if (shouldUpdatePhysics) {
            if (n.baseX < -50) n.baseX = width + 50;
            if (n.baseX > width + 50) n.baseX = -50;
            if (n.baseY < -50) n.baseY = height + 50;
            if (n.baseY > height + 50) n.baseY = -50;
          }
          return;
        }

        if (shouldUpdatePhysics) {
          n.baseX += Math.sin(time + n.timeOffset) * CONFIG.floatAmplitude * (n.z + 0.3) * 0.01;
          n.baseY += Math.cos(time * 0.7 + n.timeOffset) * CONFIG.floatAmplitude * (n.z + 0.3) * 0.01;

          n.brownianTimer++;
          if (n.brownianTimer > 100 / CONFIG.brownianChangeRate) {
            n.brownianAngle = Math.random() * Math.PI * 2;
            n.brownianTimer = 0;
          }
          
          const brownianSpeed = CONFIG.brownianStrength * (n.z * 0.5 + 0.5);
          n.baseX += Math.cos(n.brownianAngle) * brownianSpeed;
          n.baseY += Math.sin(n.brownianAngle) * brownianSpeed;

          const parallaxBaseX = n.baseX + parallaxOffsetX * n.z;
          const parallaxBaseY = n.baseY + parallaxOffsetY * n.z;

          const mouseDx = parallaxBaseX - mouseRef.current.x;
          const mouseDy = parallaxBaseY - mouseRef.current.y;
          const mouseDist = Math.hypot(mouseDx, mouseDy);

          if (mouseDist < CONFIG.mouseRadius && mouseDist > 0) {
            const force = (1 - mouseDist / CONFIG.mouseRadius) * CONFIG.mouseForce;
            const angle = Math.atan2(mouseDy, mouseDx);
            n.targetX = parallaxBaseX + Math.cos(angle) * force * 3 * n.z;
            n.targetY = parallaxBaseY + Math.sin(angle) * force * 3 * n.z;
          } else {
            n.targetX = parallaxBaseX;
            n.targetY = parallaxBaseY;
          }

          const wakeDx = n.x - mouseRef.current.x;
          const wakeDy = visualY - mouseRef.current.y;
          const wakeDist = Math.hypot(wakeDx, wakeDy);

          if (wakeDist < CONFIG.mouseRadius && wakeDist > 0 && mouseRef.current.speed > 5) {
            const wakeForce = (mouseRef.current.speed / 50) * (1 - wakeDist / CONFIG.mouseRadius);
            const angle = Math.atan2(wakeDy, wakeDx);
            const perpAngle = angle + Math.PI / 2;
            n.wakeX += Math.cos(perpAngle) * wakeForce * 0.5;
            n.wakeY += Math.sin(perpAngle) * wakeForce * 0.5;
            n.intensity = Math.max(n.intensity, (1 - wakeDist / CONFIG.mouseRadius) * 0.8 * n.z);
          }

          n.wakeX *= CONFIG.wakeDecay;
          n.wakeY *= CONFIG.wakeDecay;
        }

        const dampingFactor = CONFIG.damping * (n.z * 0.5 + 0.5);
        n.x += (n.targetX - n.x) * dampingFactor;
        n.y += (n.targetY - n.y) * dampingFactor;
        n.x += n.wakeX;
        n.y += n.wakeY;

        if (n.baseX < -50) n.baseX = width + 50;
        if (n.baseX > width + 50) n.baseX = -50;
        if (n.baseY < -50) n.baseY = height + 50;
        if (n.baseY > height + 50) n.baseY = -50;
      });

      // Verbindungen zeichnen
      neurons.forEach((n, nIndex) => {
        const visualY = n.y - scrollY;
        const viewportPadding = CONFIG.viewportPadding;
        
        if (n.x < -viewportPadding || n.x > width + viewportPadding ||
            visualY < -viewportPadding || visualY > height + viewportPadding) {
          return;
        }

        n.connections.forEach((targetIdx) => {
          const target = neurons[targetIdx];
          const targetVisualY = target.y - scrollY;
          const dist = Math.hypot(n.x - target.x, visualY - targetVisualY);
          
          if (dist < CONFIG.connectionMaxDist) {
            const zAvg = (n.z + target.z) / 2;
            const isActive = n.chargeTimer > 0 || target.chargeTimer > 0 || 
                           n.intensity > 0.15 || target.intensity > 0.15;
            
            let hasActivePulse = false;
            pulses.forEach((p) => {
              if ((p.from === nIndex && p.to === targetIdx) ||
                  (p.from === targetIdx && p.to === nIndex)) {
                hasActivePulse = true;
              }
            });
            
            if (!hasActivePulse) {
              if (isActive) {
                ctx.strokeStyle = isDark 
                  ? `rgba(255, 255, 255, ${0.25 * zAvg})` 
                  : `rgba(0, 0, 0, ${0.25 * zAvg})`;
                ctx.lineWidth = 0.8 + zAvg * 0.5;
                ctx.setLineDash([]);
                ctx.beginPath();
                ctx.moveTo(n.x, visualY);
                ctx.lineTo(target.x, targetVisualY);
                ctx.stroke();
              } else {
                const breathAlpha = Math.max(0, Math.min(0.05, (connectionAlpha * zAvg) + breathOffset));
                ctx.strokeStyle = isDark 
                  ? `rgba(255, 255, 255, ${breathAlpha})` 
                  : `rgba(0, 0, 0, ${breathAlpha})`;
                ctx.lineWidth = 0.5;
                ctx.setLineDash([2, 4]);
                ctx.beginPath();
                ctx.moveTo(n.x, visualY);
                ctx.lineTo(target.x, targetVisualY);
                ctx.stroke();
              }
            }
          }
        });
      });

      // Neuronen zeichnen
      neurons.forEach((n) => {
        const visualY = n.y - scrollY;
        const viewportPadding = CONFIG.viewportPadding;
        
        if (n.x < -viewportPadding || n.x > width + viewportPadding ||
            visualY < -viewportPadding || visualY > height + viewportPadding) {
          if (n.chargeTimer > 0) n.chargeTimer--;
          n.intensity *= 0.93;
          if (n.pulseCooldown > 0) n.pulseCooldown--;
          return;
        }

        const isActive = n.chargeTimer > 0 || n.intensity > 0.1;
        
        if (isActive) {
          const gradient = ctx.createRadialGradient(n.x, visualY, 0, n.x, visualY, n.radius * 3);
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
          ctx.arc(n.x, visualY, n.radius * 3, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.beginPath();
        const alpha = n.chargeTimer > 0 
          ? Math.min(n.intensity + 0.3, 0.6) * n.z
          : neuronAlpha * (0.7 + n.z * 0.3);
        ctx.fillStyle = `rgba(${pulseColor}, ${alpha})`;
        ctx.arc(n.x, visualY, n.radius, 0, Math.PI * 2);
        ctx.fill();

        if (n.chargeTimer > 0) n.chargeTimer--;
        n.intensity *= 0.93;
        if (n.pulseCooldown > 0) n.pulseCooldown--;
      });

      // Pulse mit "Follow-the-Signal" Trail
      if (Math.random() < 0.04 && pulses.length < CONFIG.maxPulses) {
        const start = Math.floor(Math.random() * neurons.length);
        const connections = neurons[start].connections;
        if (connections.length > 0) {
          pulses.push({
            from: start,
            to: connections[Math.floor(Math.random() * connections.length)],
            progress: 0,
            z: neurons[start].z,
            depth: 0,
            intensity: 1.0,
          });
        }
      }

      pulses = pulses.filter((p) => {
        p.progress += CONFIG.signalSpeed * (p.z + 0.5);
        
        if (p.progress >= 1) {
          const target = neurons[p.to];
          if (target) {
            const nextIntensity = p.intensity * 0.65;
            
            if (nextIntensity > CONFIG.minIntensity) {
              target.chargeTimer = CONFIG.chargeFrames;
              target.intensity = nextIntensity;
              
              if (target.pulseCooldown === 0 && 
                  p.depth < CONFIG.maxPropagationDepth &&
                  Math.random() < CONFIG.propagationChance &&
                  pulses.length < CONFIG.maxPulses) {
                
                target.pulseCooldown = CONFIG.pulseCooldownFrames;
                
                target.connections.forEach((targetIdx) => {
                  if (pulses.length >= CONFIG.maxPulses) return;
                  
                  pulses.push({
                    from: p.to,
                    to: targetIdx,
                    progress: 0,
                    z: target.z,
                    depth: p.depth + 1,
                    intensity: nextIntensity,
                  });
                });
              }
            }
          }
          return false;
        }

        const n1 = neurons[p.from];
        const n2 = neurons[p.to];
        if (!n1 || !n2) return false;

        const n1VisualY = n1.y - scrollY;
        const n2VisualY = n2.y - scrollY;
        const curX = n1.x + (n2.x - n1.x) * p.progress;
        const curY = n1VisualY + (n2VisualY - n1VisualY) * p.progress;

        const viewportPadding = CONFIG.viewportPadding;
        if (curX < -viewportPadding || curX > width + viewportPadding ||
            curY < -viewportPadding || curY > height + viewportPadding) {
          return true;
        }

        const pulseColorStr = isDark ? "255, 255, 255" : "0, 0, 0";
        
        // FOLLOW-THE-SIGNAL: Linie nur bis zum aktuellen Pulse
        const traceAlpha = p.intensity * p.z;
        const startAlpha = traceAlpha * 0.3;
        const endAlpha = traceAlpha * 0.8;
        
        const gradient = ctx.createLinearGradient(n1.x, n1VisualY, curX, curY);
        gradient.addColorStop(0, isDark 
          ? `rgba(255, 255, 255, ${startAlpha})` 
          : `rgba(0, 0, 0, ${startAlpha})`);
        gradient.addColorStop(1, isDark 
          ? `rgba(255, 255, 255, ${endAlpha})` 
          : `rgba(0, 0, 0, ${endAlpha})`);
        
        ctx.beginPath();
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.0 + p.z * 0.5;
        ctx.setLineDash([]);
        ctx.moveTo(n1.x, n1VisualY);
        ctx.lineTo(curX, curY);
        ctx.stroke();

        // Core & Halo
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        
        ctx.beginPath();
        const haloAlpha = 0.25 * p.z * p.intensity;
        ctx.fillStyle = `rgba(${pulseColorStr}, ${haloAlpha})`;
        ctx.arc(curX, curY, 2.0 * p.z * p.intensity, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        const coreAlpha = Math.min(0.98, 0.95 * p.z * p.intensity + 0.03);
        ctx.fillStyle = `rgba(${pulseColorStr}, ${coreAlpha})`;
        ctx.arc(curX, curY, 2.5 * p.z * p.intensity, 0, Math.PI * 2);
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
        pointerEvents: "auto",
      }}
    />
  );
}