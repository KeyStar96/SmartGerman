"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";

/**
 * NEURAL BACKGROUND - PERFORMANCE OPTIMIERT
 * 
 * ADAPTIVE STRATEGIE:
 * 1. Mobile/Touch → Statisches Gradient-Mesh (kein Canvas)
 * 2. Low-FPS Detection (<50fps) → Animation stoppen, Fallback
 * 3. Desktop mit gutem FPS → Reduzierte Partikel-Animation
 * 
 * Ziel: Butterweiche 60fps auf MBP 2017 und modernen Mobile Devices
 */

// ============================================
// DEVICE DETECTION
// ============================================
const isTouchDevice = (): boolean => {
  if (typeof window === "undefined") return false;
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore - Fallback für ältere Browser
    navigator.msMaxTouchPoints > 0
  );
};

const isMobileDevice = (): boolean => {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent.toLowerCase();
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
};

const isLowPowerDevice = (): boolean => {
  if (typeof window === "undefined") return false;
  // Weniger als 4 CPU-Kerne = Low Power
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) {
    return true;
  }
  // Mobile ist immer Low Power für Canvas-Animationen
  return isMobileDevice();
};

// ============================================
// STATIC GRADIENT MESH COMPONENT
// ============================================
function StaticGradientMesh() {
  return (
    <div 
      className="absolute inset-0 opacity-40 pointer-events-none"
      style={{
        background: `
          radial-gradient(ellipse 80% 60% at 20% 30%, rgba(255, 92, 0, 0.08) 0%, transparent 50%),
          radial-gradient(ellipse 60% 80% at 80% 70%, rgba(0, 150, 255, 0.06) 0%, transparent 50%),
          radial-gradient(ellipse 70% 50% at 50% 50%, rgba(255, 255, 255, 0.02) 0%, transparent 60%)
        `,
      }}
    />
  );
}

// ============================================
// REDUCED CONFIG FOR PERFORMANCE
// ============================================
const CONFIG = {
  // DRASTISCH REDUZIERT: 70% weniger Partikel als Original
  neuronDensity: 0.00025, // War 0.0008
  connectionDistance: 100, // War 120
  viewportPadding: 100, // War 200
  gridCellSize: 200, // War 150 (größere Zellen = weniger Partikel)
  
  // Sanftere Animation
  wanderRadius: 0.5, // War 1
  wanderSpeed: 0.01, // War 0.015
  springStiffness: 0.03, // War 0.04
  
  // Maus-Interaktion subtiler
  mouseInteractionRadius: 200, // War 250
  mouseForce: 0.002, // War 0.003
  damping: 0.96, // War 0.95
  
  // Signale
  signalSpeedPixelsPerSecond: 120, // War 150
  signalLength: 100, // War 120
  signalDecay: 0.5, // War 0.6
  minSignalStrength: 0.2, // War 0.15
  
  // Optik
  particleSize: 2,
  flashDecayPerSecond: 2.5, // War 2.0 (schnelleres Abklingen)
  
  // 3D deaktiviert für Performance
  zDepthRange: 0, // War 400 - DEAKTIVIERT
  zBaseOffset: 0,
  zSizeScale: 0, // Keine Größenvariation
  zBlurLayers: 0, // Kein Blur
  
  // Auto-Pulse reduziert
  autoPulseEnabled: true,
  autoPulseMinDelay: 3000, // War 2000
  autoPulseMaxDelay: 6000, // War 4000
  
  // Idle-Pulse deaktiviert (spart GPU)
  idlePulseEnabled: false,
  
  // Trail kürzer
  trailDecayPerSecond: 2.0, // War 1.2
  
  // FPS-Throttling
  targetFPS: 30, // Capped bei 30fps für stabilen Look
  minFPSThreshold: 25, // Unter 25fps = Fallback aktivieren
};

const TWO_PI = Math.PI * 2;

// ============================================
// FAST MATH (Lookup Tables)
// ============================================
const SIN_TABLE_SIZE = 180; // Reduziert für weniger Memory
const SIN_TABLE = new Float32Array(SIN_TABLE_SIZE);
const COS_TABLE = new Float32Array(SIN_TABLE_SIZE);
for (let i = 0; i < SIN_TABLE_SIZE; i++) {
  const angle = (i / SIN_TABLE_SIZE) * TWO_PI;
  SIN_TABLE[i] = Math.sin(angle);
  COS_TABLE[i] = Math.cos(angle);
}

const fastSin = (angle: number): number => {
  const normalized = ((angle % TWO_PI) + TWO_PI) % TWO_PI;
  const index = (normalized / TWO_PI * SIN_TABLE_SIZE) | 0;
  return SIN_TABLE[index];
};

const fastCos = (angle: number): number => {
  const normalized = ((angle % TWO_PI) + TWO_PI) % TWO_PI;
  const index = (normalized / TWO_PI * SIN_TABLE_SIZE) | 0;
  return COS_TABLE[index];
};

// ============================================
// THEME COLORS
// ============================================
const THEME_COLORS = {
  dark: {
    neuron: "255, 255, 255",
    signal: "255, 92, 0",
    lineOpacity: 0.05,
  },
  light: {
    neuron: "10, 10, 10",
    signal: "235, 80, 0",
    lineOpacity: 0.03,
  }
};

interface Neuron {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  wanderAngle: number;
  flash: number;
  connections: number[];
}

interface Pulse {
  fromIndex: number;
  toIndex: number;
  progress: number;
  totalDist: number;
  strength: number;
  completed: boolean;
  active: boolean;
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showFallback, setShowFallback] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });
  const neuronsRef = useRef<Neuron[]>([]);
  const pulsesRef = useRef<Pulse[]>([]);
  const themeRef = useRef(THEME_COLORS.dark);

  // ============================================
  // INITIAL DEVICE CHECK
  // ============================================
  useEffect(() => {
    // Mobile/Touch → Sofort Fallback
    if (isTouchDevice() || isMobileDevice()) {
      setShowFallback(true);
      setIsInitialized(true);
      return;
    }
    setIsInitialized(true);
  }, []);

  // ============================================
  // HERO ANIMATION COMPLETE LISTENER
  // ============================================
  useEffect(() => {
    const handleHeroComplete = () => {
      if (containerRef.current) {
        gsap.to(containerRef.current, {
          opacity: 1,
          duration: 1.5,
          ease: "power2.out",
        });
      }
    };

    window.addEventListener('hero-animation-complete', handleHeroComplete);
    return () => window.removeEventListener('hero-animation-complete', handleHeroComplete);
  }, []);

  // ============================================
  // CANVAS ANIMATION (nur wenn kein Fallback)
  // ============================================
  useEffect(() => {
    if (showFallback || !isInitialized) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { 
      alpha: true,
      desynchronized: true,
    });
    if (!ctx) {
      setShowFallback(true);
      return;
    }

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let isRunning = true;
    
    // FPS Monitoring für Adaptive Performance
    let frameCount = 0;
    let lastFPSCheck = performance.now();
    let currentFPS = 60;
    let lowFPSFrames = 0;
    const LOW_FPS_THRESHOLD = 10; // 10 consecutive low-fps frames = fallback

    // ============================================
    // THEME DETECTION
    // ============================================
    const updateTheme = () => {
      const isDark = document.documentElement.classList.contains("dark");
      themeRef.current = isDark ? THEME_COLORS.dark : THEME_COLORS.light;
    };

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    updateTheme();

    // ============================================
    // INIT NETWORK (Simplified)
    // ============================================
    const initNetwork = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      
      // DPR Clamping für Performance
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const extendedWidth = width + (CONFIG.viewportPadding * 2);
      const extendedHeight = height + (CONFIG.viewportPadding * 2);
      
      const newNeurons: Neuron[] = [];
      const gridCols = Math.ceil(extendedWidth / CONFIG.gridCellSize);
      const gridRows = Math.ceil(extendedHeight / CONFIG.gridCellSize);
      
      // Einfaches Grid-basiertes Layout
      for (let row = 0; row < gridRows; row++) {
        for (let col = 0; col < gridCols; col++) {
          // Nur 50% der Zellen befüllen für noch weniger Partikel
          if (Math.random() > 0.5) continue;
          
          const cellX = (col * CONFIG.gridCellSize) - CONFIG.viewportPadding + (Math.random() * CONFIG.gridCellSize);
          const cellY = (row * CONFIG.gridCellSize) - CONFIG.viewportPadding + (Math.random() * CONFIG.gridCellSize);
          
          newNeurons.push({
            x: cellX,
            y: cellY,
            baseX: cellX,
            baseY: cellY,
            vx: 0,
            vy: 0,
            wanderAngle: Math.random() * TWO_PI,
            flash: 0,
            connections: [],
          });
        }
      }

      // Verbindungen berechnen (vereinfacht)
      const numNeurons = newNeurons.length;
      for (let i = 0; i < numNeurons; i++) {
        const n = newNeurons[i];
        
        for (let j = i + 1; j < numNeurons; j++) {
          const other = newNeurons[j];
          const dx = n.x - other.x;
          const dy = n.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < CONFIG.connectionDistance) {
            if (n.connections.length < 2) {
              n.connections.push(j);
            }
            if (other.connections.length < 2) {
              other.connections.push(i);
            }
          }
        }
      }

      neuronsRef.current = newNeurons;
      pulsesRef.current = [];
    };

    // ============================================
    // SPAWN PULSE
    // ============================================
    const spawnPulse = (fromIdx: number, toIdx: number, strength: number) => {
      // Max 10 aktive Pulses für Performance
      const activePulses = pulsesRef.current.filter(p => p.active);
      if (activePulses.length >= 10) return;
      
      pulsesRef.current.push({
        fromIndex: fromIdx,
        toIndex: toIdx,
        progress: 0,
        totalDist: 0,
        strength,
        completed: false,
        active: true,
      });
    };

    // ============================================
    // PHYSICS UPDATE (Simplified)
    // ============================================
    const updatePhysics = (deltaSeconds: number) => {
      const neurons = neuronsRef.current;
      const mouse = mouseRef.current;
      const timeScale = deltaSeconds * 60;
      
      for (let i = 0; i < neurons.length; i++) {
        const n = neurons[i];

        // Sanftes Wandern
        n.wanderAngle += (Math.random() - 0.5) * CONFIG.wanderSpeed * timeScale;
        n.vx += fastCos(n.wanderAngle) * CONFIG.wanderRadius * timeScale;
        n.vy += fastSin(n.wanderAngle) * CONFIG.wanderRadius * timeScale;

        // Spring zur Basis
        n.vx += (n.baseX - n.x) * CONFIG.springStiffness * timeScale;
        n.vy += (n.baseY - n.y) * CONFIG.springStiffness * timeScale;

        // Maus-Interaktion (nur wenn aktiv)
        if (mouse.active) {
          const dxMouse = mouse.x - n.x;
          const dyMouse = mouse.y - n.y;
          const distMouseSq = dxMouse * dxMouse + dyMouse * dyMouse;
          const radiusSq = CONFIG.mouseInteractionRadius * CONFIG.mouseInteractionRadius;

          if (distMouseSq < radiusSq) {
            const distMouse = Math.sqrt(distMouseSq);
            const force = (1 - distMouse / CONFIG.mouseInteractionRadius) * CONFIG.mouseForce * timeScale;
            n.vx += dxMouse * force;
            n.vy += dyMouse * force;
          }
        }

        // Damping & Update
        n.vx *= CONFIG.damping;
        n.vy *= CONFIG.damping;
        n.x += n.vx * timeScale;
        n.y += n.vy * timeScale;

        // Flash decay
        if (n.flash > 0) {
          n.flash = Math.max(0, n.flash - CONFIG.flashDecayPerSecond * deltaSeconds);
        }
      }
    };

    // ============================================
    // DRAW (Simplified)
    // ============================================
    const draw = (deltaSeconds: number) => {
      ctx.clearRect(0, 0, width, height);
      
      const neurons = neuronsRef.current;
      const pulses = pulsesRef.current;
      const theme = themeRef.current;
      const signalSpeed = CONFIG.signalSpeedPixelsPerSecond * deltaSeconds;

      // Update Pulses
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i];
        if (!p.active) continue;
        
        const nA = neurons[p.fromIndex];
        const nB = neurons[p.toIndex];

        if (p.totalDist === 0) {
          const dx = nB.x - nA.x;
          const dy = nB.y - nA.y;
          p.totalDist = Math.sqrt(dx * dx + dy * dy);
        }

        if (!p.completed) {
          p.progress += signalSpeed / (p.totalDist || 1);
        }

        if (p.progress >= 1.0 && !p.completed) {
          p.completed = true;
          nB.flash = p.strength;

          // Child Pulses (reduziert)
          if (p.strength * CONFIG.signalDecay > CONFIG.minSignalStrength) {
            const newStrength = p.strength * CONFIG.signalDecay;
            for (const neighborIdx of nB.connections) {
              if (neighborIdx !== p.fromIndex) {
                spawnPulse(p.toIndex, neighborIdx, newStrength);
              }
            }
          }
        }

        // Cleanup
        if (p.completed && p.progress > 1.5) {
          pulses.splice(i, 1);
        }
      }

      // Draw Connections
      ctx.globalCompositeOperation = "lighter";
      
      const drawnConnections = new Set<string>();
      
      for (let i = 0; i < neurons.length; i++) {
        const n = neurons[i];
        if (n.x < -50 || n.x > width + 50 || n.y < -50 || n.y > height + 50) continue;

        for (const targetIdx of n.connections) {
          const key = i < targetIdx ? `${i}-${targetIdx}` : `${targetIdx}-${i}`;
          if (drawnConnections.has(key)) continue;
          drawnConnections.add(key);

          const target = neurons[targetIdx];
          
          // Basis-Linie
          ctx.strokeStyle = `rgba(${theme.neuron}, ${theme.lineOpacity})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(n.x, n.y);
          ctx.lineTo(target.x, target.y);
          ctx.stroke();

          // Aktive Pulses auf dieser Verbindung
          for (const p of pulses) {
            if (!p.active) continue;
            
            const isForward = p.fromIndex === i && p.toIndex === targetIdx;
            const isReverse = p.fromIndex === targetIdx && p.toIndex === i;
            
            if (isForward || isReverse) {
              const t = Math.min(p.progress, 1.0);
              const intensity = p.strength;
              
              // Nur Kopf-Punkt zeichnen (kein aufwändiger Trail)
              const headT = isForward ? t : (1 - t);
              const headX = n.x + (target.x - n.x) * headT;
              const headY = n.y + (target.y - n.y) * headT;
              
              // Glow-Punkt
              ctx.fillStyle = `rgba(${theme.signal}, ${intensity})`;
              ctx.beginPath();
              ctx.arc(headX, headY, 3 * intensity, 0, TWO_PI);
              ctx.fill();
            }
          }
        }
      }

      // Draw Neurons
      const isDark = theme === THEME_COLORS.dark;
      ctx.globalCompositeOperation = isDark ? "lighter" : "source-over";

      for (let i = 0; i < neurons.length; i++) {
        const n = neurons[i];
        if (n.x < -20 || n.x > width + 20 || n.y < -20 || n.y > height + 20) continue;

        const alpha = isDark ? 0.15 + n.flash * 0.5 : 0.1 + n.flash * 0.35;
        
        ctx.fillStyle = `rgba(${theme.neuron}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, CONFIG.particleSize, 0, TWO_PI);
        ctx.fill();

        // Flash Glow
        if (n.flash > 0.01) {
          const glowRadius = CONFIG.particleSize * 3 + (n.flash * 10);
          const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, glowRadius);
          glow.addColorStop(0, `rgba(${theme.signal}, ${n.flash * 0.8})`);
          glow.addColorStop(1, `rgba(${theme.signal}, 0)`);
          
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(n.x, n.y, glowRadius, 0, TWO_PI);
          ctx.fill();
        }
      }

      ctx.globalCompositeOperation = "source-over";
    };

    // ============================================
    // ANIMATION LOOP (FPS-Capped)
    // ============================================
    let lastFrameTime = performance.now();
    const frameInterval = 1000 / CONFIG.targetFPS;

    const loop = (currentTime: number) => {
      if (!isRunning) return;
      
      const deltaTime = currentTime - lastFrameTime;
      
      // FPS Monitoring
      frameCount++;
      if (currentTime - lastFPSCheck >= 1000) {
        currentFPS = frameCount;
        frameCount = 0;
        lastFPSCheck = currentTime;
        
        // Low FPS Detection
        if (currentFPS < CONFIG.minFPSThreshold) {
          lowFPSFrames++;
          if (lowFPSFrames >= LOW_FPS_THRESHOLD) {
            setShowFallback(true);
            isRunning = false;
            return;
          }
        } else {
          lowFPSFrames = Math.max(0, lowFPSFrames - 1);
        }
      }

      // Frame-Rate Limiting
      if (deltaTime < frameInterval * 0.9) {
        animationFrameId = requestAnimationFrame(loop);
        return;
      }

      const clampedDelta = Math.min(deltaTime, 100);
      const deltaSeconds = clampedDelta / 1000;
      lastFrameTime = currentTime;

      updatePhysics(deltaSeconds);
      draw(deltaSeconds);
      
      animationFrameId = requestAnimationFrame(loop);
    };

    // ============================================
    // EVENT HANDLERS
    // ============================================
    let resizeTimeout: NodeJS.Timeout | null = null;
    const handleResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        initNetwork();
      }, 300);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY, active: true };
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    const handleClick = (e: MouseEvent) => {
      const neurons = neuronsRef.current;
      let closestIdx = -1;
      let minDist = Infinity;

      for (let i = 0; i < neurons.length; i++) {
        const dx = neurons[i].x - e.clientX;
        const dy = neurons[i].y - e.clientY;
        const dist = dx * dx + dy * dy;
        if (dist < minDist) {
          minDist = dist;
          closestIdx = i;
        }
      }

      if (closestIdx !== -1 && minDist < 150 * 150) {
        const startNode = neurons[closestIdx];
        startNode.flash = 1.0;
        for (const targetIdx of startNode.connections) {
          spawnPulse(closestIdx, targetIdx, 1.0);
        }
      }
    };

    // Auto-Pulse (seltener)
    let autoPulseTimeout: NodeJS.Timeout | null = null;
    const triggerAutoPulse = () => {
      if (!isRunning) return;
      
      const neurons = neuronsRef.current;
      if (neurons.length > 0) {
        const randomIdx = Math.floor(Math.random() * neurons.length);
        const startNode = neurons[randomIdx];
        startNode.flash = 1.0;
        for (const targetIdx of startNode.connections) {
          spawnPulse(randomIdx, targetIdx, 1.0);
        }
      }
      
      const delay = CONFIG.autoPulseMinDelay + Math.random() * (CONFIG.autoPulseMaxDelay - CONFIG.autoPulseMinDelay);
      autoPulseTimeout = setTimeout(triggerAutoPulse, delay);
    };

    // ============================================
    // STARTUP
    // ============================================
    initNetwork();
    loop(performance.now());
    
    if (CONFIG.autoPulseEnabled) {
      autoPulseTimeout = setTimeout(triggerAutoPulse, 1000);
    }

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("click", handleClick);

    // ============================================
    // CLEANUP
    // ============================================
    return () => {
      isRunning = false;
      if (resizeTimeout) clearTimeout(resizeTimeout);
      if (autoPulseTimeout) clearTimeout(autoPulseTimeout);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("click", handleClick);
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
    };
  }, [showFallback, isInitialized]);

  // ============================================
  // RENDER
  // ============================================
  return (
    <div
      ref={containerRef}
      className="fixed inset-0 -z-10"
      style={{ opacity: 0 }}
    >
      {showFallback ? (
        <StaticGradientMesh />
      ) : (
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{
            opacity: 0.4,
            pointerEvents: "auto",
          }}
        />
      )}
    </div>
  );
}
