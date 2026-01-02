"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

/**
 * CONFIG: Physics & Grid
 * 
 * OPTIMIERUNG: Zeit-basierte Animationen für konsistente Geschwindigkeit
 * auf allen Bildschirmgrößen und Browsern
 */
const CONFIG = {
  // Gitter & Dichte
  neuronDensity: 0.0008,     
  connectionDistance: 120,    
  viewportPadding: 200,       
  gridCellSize: 150,          
  
  // "Freies Schwimmen"
  wanderRadius: 1,          
  wanderSpeed: 0.015,         
  springStiffness: 0.04,     
  
  // Sanfte Maus-Interaktion
  mouseInteractionRadius: 250, 
  mouseForce: 0.003,          
  damping: 0.95,              
  
  // Signale - ZEIT-BASIERT für konsistente Geschwindigkeit
  // signalSpeedPixelsPerSecond: Absolute Geschwindigkeit in Pixeln pro Sekunde
  signalSpeedPixelsPerSecond: 150,  // Pixel pro Sekunde
  signalLength: 120,          
  signalDecay: 0.6,           
  minSignalStrength: 0.15,    
  
  // Optik Basis
  particleSize: 2,
  flashDecayPerSecond: 2.0,   // Flash klingt mit 2.0 pro Sekunde ab
  
  // 3D Z-Dimension
  zDepthRange: 400,           
  zBaseOffset: 0,             
  zSizeScale: 0.8,            
  zBlurLayers: 3,             
  
  // Auto-Impulse
  autoPulseEnabled: true,     
  autoPulseMinDelay: 2000,    
  autoPulseMaxDelay: 4000,    
  
  // Ruhe-Puls-Animation
  idlePulseEnabled: true,     
  idlePulseIntensity: 0.6,    
  idlePulseSpeed: 0.05,
  
  // Trail-Effekt: Wie schnell der Glow hinter dem Impuls über ZEIT verblasst
  // Niedrigerer Wert = länger sichtbarer Trail (langsameres Verblassen)
  trailDecayPerSecond: 1.2,  // Intensität pro Sekunde, die abgezogen wird (erhöht für kürzeren Trail)
} as const;

// PERFORMANCE: Pre-computed Math constants
const TWO_PI = Math.PI * 2;
const HALF_PI = Math.PI / 2;

// PERFORMANCE: Sin/Cos Lookup Table für schnellere Trigonometrie
const SIN_TABLE_SIZE = 360;
const SIN_TABLE: Float32Array = new Float32Array(SIN_TABLE_SIZE);
const COS_TABLE: Float32Array = new Float32Array(SIN_TABLE_SIZE);
for (let i = 0; i < SIN_TABLE_SIZE; i++) {
  const angle = (i / SIN_TABLE_SIZE) * TWO_PI;
  SIN_TABLE[i] = Math.sin(angle);
  COS_TABLE[i] = Math.cos(angle);
}

// PERFORMANCE: Fast sin/cos using lookup table
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

// Farb-Konfigurationen für Light/Dark
const THEME_COLORS = {
  dark: {
    neuron: "255, 255, 255", 
    signal: "255, 92, 0",    
    lineOpacity: 0.06,       
  },
  light: {
    neuron: "10, 10, 10",    
    signal: "235, 80, 0",    
    lineOpacity: 0.04,         
  }
};

interface Neuron {
  x: number;
  y: number;
  z: number;
  baseX: number;
  baseY: number;
  baseZ: number;
  vx: number;
  vy: number;
  vz: number;
  wanderAngle: number;
  flash: number;
  connections: number[];
  idlePulsePhase: number; 
}

interface Pulse {
  id: number;
  fromIndex: number;
  toIndex: number;
  progress: number;      // 0 bis 1 (Prozent der Verbindungslänge)
  totalDist: number;
  strength: number;
  // Trail: Intensitäten für jedes Segment (klingen über Zeit ab)
  trailIntensities: Float32Array | number[];  // PERFORMANCE: TypedArray für bessere Performance
  lastHeadSegment: number;  // Letztes Segment, das der Kopf erreicht hat
  completed: boolean;       // True wenn der Pulse das Ziel erreicht hat, aber noch abklingt
  active: boolean;          // PERFORMANCE: Object Pool - markiert ob Pulse aktiv ist
}

// PERFORMANCE: Object Pool für Pulses - vermeidet GC-Spikes
class PulsePool {
  private pool: Pulse[] = [];
  private activeCount = 0;
  private idCounter = 0;
  
  acquire(fromIndex: number, toIndex: number, strength: number): Pulse {
    // Suche einen inaktiven Pulse im Pool
    for (let i = 0; i < this.pool.length; i++) {
      if (!this.pool[i].active) {
        const pulse = this.pool[i];
        pulse.id = this.idCounter++;
        pulse.fromIndex = fromIndex;
        pulse.toIndex = toIndex;
        pulse.progress = 0;
        pulse.totalDist = 0;
        pulse.strength = strength;
        pulse.lastHeadSegment = -1;
        pulse.completed = false;
        pulse.active = true;
        // Reset trailIntensities wird beim ersten Draw gemacht
        if (pulse.trailIntensities instanceof Float32Array) {
          pulse.trailIntensities.fill(0);
        } else {
          pulse.trailIntensities = [];
        }
        this.activeCount++;
        return pulse;
      }
    }
    
    // Keine inaktiven Pulses verfügbar - erstelle neuen
    const newPulse: Pulse = {
      id: this.idCounter++,
      fromIndex,
      toIndex,
      progress: 0,
      totalDist: 0,
      strength,
      trailIntensities: [],
      lastHeadSegment: -1,
      completed: false,
      active: true,
    };
    this.pool.push(newPulse);
    this.activeCount++;
    return newPulse;
  }
  
  release(pulse: Pulse): void {
    pulse.active = false;
    this.activeCount--;
  }
  
  getActivePulses(): Pulse[] {
    // PERFORMANCE: Filtere nur aktive Pulses
    return this.pool.filter(p => p.active);
  }
  
  get count(): number {
    return this.activeCount;
  }
  
  clear(): void {
    for (const pulse of this.pool) {
      pulse.active = false;
    }
    this.activeCount = 0;
  }
}

export default function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });
  const neuronsRef = useRef<Neuron[]>([]);
  // PERFORMANCE: Object Pool statt Array für Pulses
  const pulsePoolRef = useRef<PulsePool>(new PulsePool());
  
  const themeRef = useRef(THEME_COLORS.dark);

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
    
    return () => {
      window.removeEventListener('hero-animation-complete', handleHeroComplete);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return () => {}; 

    // SAFARI-DETECTION: Safari auf macOS hat spezielle Canvas-Performance-Probleme
    const isSafariMac = /^((?!chrome|android).)*safari/i.test(navigator.userAgent) &&
                        /Macintosh/.test(navigator.userAgent);
    
    // SAFARI-OPTIMIERUNG: Angepasste Einstellungen für bessere Performance
    const SAFARI_CONFIG = {
      // Niedrigere DPR für Safari (1.0 statt 1.5) - größter Performance-Gewinn
      maxDPR: isSafariMac ? 1.0 : 1.5,
      // Weniger Blur-Layers in Safari
      zBlurLayers: isSafariMac ? 1 : CONFIG.zBlurLayers,
      // Aggressiveres Scroll-Throttling für Safari
      scrollFPS: isSafariMac ? 12 : 20,
      normalFPS: isSafariMac ? 45 : 60,
      // Längere Idle-Zeit nach Scroll für Safari
      scrollIdleDelay: isSafariMac ? 200 : 150,
    };

    // Performance: desynchronized reduziert Latenz
    const ctx = canvas.getContext("2d", { 
      alpha: true,
      desynchronized: true, 
      willReadFrequently: false 
    });
    if (!ctx) return () => {}; 

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let lastResizeWidth = 0;
    let lastResizeHeight = 0;
    let resizeTimeout: NodeJS.Timeout | null = null;
    let idlePulseTime = 0; 
    
    // Auto-Pulse State
    let estimatedPulseLifetime = 0;
    
    // PERFORMANCE: Wiederverwendbare Map/Set-Objekte um Memory-Allokationen zu reduzieren
    const connectionPulsesCache = new Map<string, Pulse[]>();
    const connectionsDrawnCache = new Set<string>();
    const visibleNeuronIndicesCache = new Set<number>(); 

    // --- 0. Theme Detection ---
    const updateTheme = () => {
      const isDark = document.documentElement.classList.contains("dark");
      themeRef.current = isDark ? THEME_COLORS.dark : THEME_COLORS.light;
    };

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    updateTheme(); 

    // --- 1. Init Network ---
    const initNetwork = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      
      // --------------------------------------------------------
      // PERFORMANCE OPTIMIZATION: DPR Capping
      // Safari Mac: 1.0x (niedrigste Auflösung für beste Performance)
      // Andere Browser: 1.5x
      // --------------------------------------------------------
      const dpr = Math.min(window.devicePixelRatio || 1, SAFARI_CONFIG.maxDPR);
      
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const extendedWidth = width + (CONFIG.viewportPadding * 2);
      const extendedHeight = height + (CONFIG.viewportPadding * 2);
      const area = width * height; 
      const baseNumNeurons = Math.floor(area * CONFIG.neuronDensity);
      
      const newNeurons: Neuron[] = [];

      const gridCols = Math.ceil(extendedWidth / CONFIG.gridCellSize);
      const gridRows = Math.ceil(extendedHeight / CONFIG.gridCellSize);
      
      for (let row = 0; row < gridRows; row++) {
        for (let col = 0; col < gridCols; col++) {
          const cellX = (col * CONFIG.gridCellSize) - CONFIG.viewportPadding + (Math.random() * CONFIG.gridCellSize);
          const cellY = (row * CONFIG.gridCellSize) - CONFIG.viewportPadding + (Math.random() * CONFIG.gridCellSize);
          const cellZ = (Math.random() - 0.5) * CONFIG.zDepthRange + CONFIG.zBaseOffset;
          newNeurons.push({
            x: cellX,
            y: cellY,
            z: cellZ,
            baseX: cellX,
            baseY: cellY,
            baseZ: cellZ,
            vx: 0,
            vy: 0,
            vz: 0,
            wanderAngle: Math.random() * Math.PI * 2,
            flash: 0,
            connections: [],
            idlePulsePhase: Math.random() * Math.PI * 2, 
          });
        }
      }
      
      const additionalNeurons = baseNumNeurons - newNeurons.length;
      for (let i = 0; i < additionalNeurons; i++) {
        const x = (Math.random() * extendedWidth) - CONFIG.viewportPadding;
        const y = (Math.random() * extendedHeight) - CONFIG.viewportPadding;
        const z = (Math.random() - 0.5) * CONFIG.zDepthRange + CONFIG.zBaseOffset;
        newNeurons.push({
          x, y, z,
          baseX: x,
          baseY: y,
          baseZ: z,
          vx: 0,
          vy: 0,
          vz: 0,
          wanderAngle: Math.random() * Math.PI * 2,
          flash: 0,
          connections: [],
          idlePulsePhase: Math.random() * Math.PI * 2, 
        });
      }

      const numNeurons = newNeurons.length;
      
      // PERFORMANCE: Spatial Grid für O(n) statt O(n²) Verbindungsberechnung
      // Erstelle ein Grid basierend auf connectionDistance
      const spatialGridCellSize = CONFIG.connectionDistance * 1.5; // Etwas größer für Sicherheit
      const spatialGridCols = Math.ceil(extendedWidth / spatialGridCellSize);
      const spatialGridRows = Math.ceil(extendedHeight / spatialGridCellSize);
      const spatialGrid: number[][] = [];
      
      // Initialisiere Grid
      for (let i = 0; i < spatialGridRows * spatialGridCols; i++) {
        spatialGrid[i] = [];
      }
      
      // Füge Neuronen zum Grid hinzu
      for (let i = 0; i < numNeurons; i++) {
        const n = newNeurons[i];
        const gridX = Math.floor((n.x + CONFIG.viewportPadding) / spatialGridCellSize);
        const gridY = Math.floor((n.y + CONFIG.viewportPadding) / spatialGridCellSize);
        const gridIdx = Math.min(gridY * spatialGridCols + gridX, spatialGrid.length - 1);
        if (gridIdx >= 0) {
          spatialGrid[gridIdx].push(i);
        }
      }
      
      // PERFORMANCE: Set für O(1) Lookups statt Array.includes() O(n)
      const connectionSet = new Set<string>();
      
      for (let i = 0; i < numNeurons; i++) {
        const n = newNeurons[i];
        const distances: Array<{ index: number; dist: number }> = [];
        
        // PERFORMANCE: Prüfe nur Neuronen in benachbarten Grid-Zellen
        const gridX = Math.floor((n.x + CONFIG.viewportPadding) / spatialGridCellSize);
        const gridY = Math.floor((n.y + CONFIG.viewportPadding) / spatialGridCellSize);
        
        // Prüfe 3x3 Grid um das Neuron
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const checkX = gridX + dx;
            const checkY = gridY + dy;
            if (checkX < 0 || checkX >= spatialGridCols || checkY < 0 || checkY >= spatialGridRows) continue;
            
            const gridIdx = checkY * spatialGridCols + checkX;
            const cellNeurons = spatialGrid[gridIdx] || [];
            
            for (const j of cellNeurons) {
              if (i === j) continue;
              
              const dx2 = n.x - newNeurons[j].x;
              const dy2 = n.y - newNeurons[j].y;
              const distSquared = dx2 * dx2 + dy2 * dy2;
              const maxDistSquared = CONFIG.connectionDistance * CONFIG.connectionDistance;
              
              // PERFORMANCE: Verwende distSquared statt sqrt für Vergleich
              if (distSquared <= maxDistSquared) {
                const dist = Math.sqrt(distSquared);
                distances.push({ index: j, dist });
              }
            }
          }
        }
        
        distances.sort((a, b) => a.dist - b.dist);
        
        let connectionsAdded = 0;
        for (const neighbor of distances) {
          if (connectionsAdded >= 3) break;
          
          // PERFORMANCE: Set für O(1) Lookup
          const connectionKey = `${Math.min(i, neighbor.index)}-${Math.max(i, neighbor.index)}`;
          if (connectionSet.has(connectionKey)) continue;
          
          newNeurons[i].connections.push(neighbor.index);
          if (!newNeurons[neighbor.index].connections.includes(i)) {
            newNeurons[neighbor.index].connections.push(i);
          }
          connectionSet.add(connectionKey);
          connectionsAdded++;
        }
      }

      neuronsRef.current = newNeurons;
      pulsePoolRef.current.clear();
      estimatedPulseLifetime = 0;
    };

    // PERFORMANCE: Nutze Object Pool für Pulses
    const spawnPulse = (fromIdx: number, toIdx: number, strength: number) => {
      pulsePoolRef.current.acquire(fromIdx, toIdx, strength);
    };

    // --- 2. Physik (Zeit-basiert für konsistente Animation) ---
    const updatePhysics = (deltaSeconds: number) => {
      const neurons = neuronsRef.current;
      const mouse = mouseRef.current;
      const numNeurons = neurons.length;
      
      // PERFORMANCE: Pre-compute constants outside loop
      const timeScale = deltaSeconds * 60;
      const wanderSpeedScaled = CONFIG.wanderSpeed * timeScale;
      const springScaled = CONFIG.springStiffness * timeScale;
      const flashDecay = CONFIG.flashDecayPerSecond * deltaSeconds;
      const mouseRadius = CONFIG.mouseInteractionRadius;
      const mouseSquared = mouse.active ? mouseRadius * mouseRadius : 0;
      const mouseX = mouse.x;
      const mouseY = mouse.y;
      const mouseForce = CONFIG.mouseForce;
      const wanderRadius = CONFIG.wanderRadius;
      
      // PERFORMANCE: Pre-compute damping factor (pow is expensive)
      // Für timeScale ≈ 1 (60fps) ist dampingFactor ≈ CONFIG.damping
      const dampingFactor = Math.abs(timeScale - 1) < 0.01 
        ? CONFIG.damping 
        : Math.pow(CONFIG.damping, timeScale);

      for (let i = 0; i < numNeurons; i++) {
        const n = neurons[i];

        // PERFORMANCE: Use fastSin/fastCos lookup tables
        n.wanderAngle += (Math.random() - 0.5) * wanderSpeedScaled;
        const wanderX = fastCos(n.wanderAngle) * wanderRadius;
        const wanderY = fastSin(n.wanderAngle) * wanderRadius;
        
        n.vx += wanderX * timeScale;
        n.vy += wanderY * timeScale;

        // Spring force to base position
        n.vx += (n.baseX - n.x) * springScaled;
        n.vy += (n.baseY - n.y) * springScaled;
        n.vz += (n.baseZ - n.z) * springScaled;

        // Mouse interaction
        if (mouseSquared > 0) {
          const dxMouse = mouseX - n.x;
          const dyMouse = mouseY - n.y;
          const distMouseSquared = dxMouse * dxMouse + dyMouse * dyMouse;

          if (distMouseSquared < mouseSquared) {
            // PERFORMANCE: Fast inverse sqrt approximation for distance
            const distMouse = Math.sqrt(distMouseSquared);
            const force = (1 - distMouse / mouseRadius) * mouseForce * timeScale;
            n.vx += dxMouse * force;
            n.vy += dyMouse * force;
          }
        }

        // Apply damping and update position
        n.vx *= dampingFactor;
        n.vy *= dampingFactor;
        n.vz *= dampingFactor;
        n.x += n.vx * timeScale;
        n.y += n.vy * timeScale;
        n.z += n.vz * timeScale;

        // Flash decay (time-based)
        if (n.flash > 0) {
          n.flash = Math.max(0, n.flash - flashDecay);
        }
      }
    };

    // --- 3. Rendering ---
    const normalizeZ = (z: number): number => {
      const normalized = (z - CONFIG.zBaseOffset + CONFIG.zDepthRange / 2) / CONFIG.zDepthRange;
      return Math.max(0, Math.min(1, normalized));
    };

    const draw = (deltaSeconds: number) => {
      ctx.clearRect(0, 0, width, height);
      
      const neurons = neuronsRef.current;
      const pulsePool = pulsePoolRef.current;
      const pulses = pulsePool.getActivePulses();
      const theme = themeRef.current;
      
      // PERFORMANCE: Pre-compute bounds
      const viewportPadding = 100;
      const boundsLeft = -viewportPadding;
      const boundsRight = width + viewportPadding;
      const boundsTop = -viewportPadding;
      const boundsBottom = height + viewportPadding;

      // PERFORMANCE: Inline filtering statt .filter() für weniger Overhead
      const visibleNeurons: Neuron[] = [];
      for (let i = 0; i < neurons.length; i++) {
        const n = neurons[i];
        if (n.x >= boundsLeft && n.x <= boundsRight && 
            n.y >= boundsTop && n.y <= boundsBottom) {
          visibleNeurons.push(n);
        }
      }

      // PERFORMANCE: Inline sort für Z-Sortierung
      visibleNeurons.sort((a, b) => a.z - b.z);

      // PERFORMANCE: Pre-compute signal speed
      const signalSpeed = CONFIG.signalSpeedPixelsPerSecond * deltaSeconds;
      const signalDecay = CONFIG.signalDecay;
      const minStrength = CONFIG.minSignalStrength;
      
      // 1. Update Pulse Progress (ZEIT-BASIERT für konsistente Geschwindigkeit)
      // PERFORMANCE: Collect pulses to release after iteration
      const pulsesToRelease: Pulse[] = [];
      
      for (let i = 0; i < pulses.length; i++) {
        const p = pulses[i];
        const nA = neurons[p.fromIndex];
        const nB = neurons[p.toIndex];

        const dx = nB.x - nA.x;
        const dy = nB.y - nA.y;
        
        if (p.totalDist === 0) {
          p.totalDist = Math.sqrt(dx * dx + dy * dy);
        }
        
        // ZEIT-BASIERT: Progress ist 0-1 (Prozent der Verbindungslänge)
        if (!p.completed) {
          p.progress += signalSpeed / (p.totalDist || 1);
        }

        if (p.progress >= 1.0 && !p.completed) {
          // Pulse hat das Ziel erreicht
          p.completed = true;
          p.progress = 1.0;
          nB.flash = p.strength;

          // Spawn child pulses
          if (p.strength * signalDecay > minStrength) {
            const newStrength = p.strength * signalDecay;
            const connections = nB.connections;
            const fromIndex = p.fromIndex;
            const toIndex = p.toIndex;
            for (let j = 0; j < connections.length; j++) {
              const neighborIdx = connections[j];
              if (neighborIdx !== fromIndex) {
                spawnPulse(toIndex, neighborIdx, newStrength);
              }
            }
          }
        }
        
        // Check if trail has faded out
        if (p.completed) {
          let hasActiveTrail = false;
          const trailIntensities = p.trailIntensities;
          const trailLength = trailIntensities.length;
          
          for (let seg = 0; seg < trailLength; seg++) {
            if (trailIntensities[seg] > 0.01) {
              hasActiveTrail = true;
              break;
            }
          }
          
          if (!hasActiveTrail) {
            pulsesToRelease.push(p);
          }
        }
      }
      
      // PERFORMANCE: Release completed pulses back to pool
      for (let i = 0; i < pulsesToRelease.length; i++) {
        pulsePool.release(pulsesToRelease[i]);
      }

      // 2. Verbindungen 
      ctx.globalCompositeOperation = "lighter";
      
      // PERFORMANCE: Wiederverwende Map/Set statt neue zu erstellen
      connectionPulsesCache.clear();
      for (let i = 0; i < pulses.length; i++) {
        const p = pulses[i];
        // PERFORMANCE: Bitwise min/max für Integer
        const minIdx = p.fromIndex < p.toIndex ? p.fromIndex : p.toIndex;
        const maxIdx = p.fromIndex < p.toIndex ? p.toIndex : p.fromIndex;
        const connectionKey = `${minIdx}-${maxIdx}`;
        let arr = connectionPulsesCache.get(connectionKey);
        if (!arr) {
          arr = [];
          connectionPulsesCache.set(connectionKey, arr);
        }
        arr.push(p);
      }

      connectionsDrawnCache.clear();
      visibleNeuronIndicesCache.clear();
      for (let i = 0; i < neurons.length; i++) {
        const n = neurons[i];
        if (n.x >= boundsLeft && n.x <= boundsRight && 
            n.y >= boundsTop && n.y <= boundsBottom) {
          visibleNeuronIndicesCache.add(i);
        }
      }

      for (let i = 0; i < neurons.length; i++) {
        if (!visibleNeuronIndicesCache.has(i)) continue;
        
        const n = neurons[i];
        for (const targetIdx of n.connections) {
            if (targetIdx > i) {
            if (!visibleNeuronIndicesCache.has(targetIdx)) continue;
            
            const target = neurons[targetIdx];
            const connectionKey = `${i}-${targetIdx}`;
            if (connectionsDrawnCache.has(connectionKey)) continue;
            connectionsDrawnCache.add(connectionKey);
            
            const avgZ = (n.z + target.z) / 2;
            const zNormalized = normalizeZ(avgZ);
            
            const baseLineOpacity = theme.lineOpacity * (0.5 + zNormalized * 0.5);
            const baseLineWidth = 0.5 + zNormalized * 0.5;
            const lineWidth = baseLineWidth * 1.4;
            
            const dx = target.x - n.x;
            const dy = target.y - n.y;
            const currentDist = Math.sqrt(dx * dx + dy * dy);
            
            const pulsesOnConnection = connectionPulsesCache.get(connectionKey) || [];
            let numSegments = Math.min(Math.ceil(currentDist / 4), 40);
            const segmentIntensities = new Map<number, number>();
            const hasActivePulses = pulsesOnConnection.length > 0;
            
            // Schritt 1: Pulse-Trails berechnen und Intensitäten sammeln
            if (hasActivePulses) {
              // Verwende totalDist vom ersten Pulse für konsistente Segment-Anzahl
              const drawDist = pulsesOnConnection[0].totalDist > 0 ? pulsesOnConnection[0].totalDist : currentDist;
              numSegments = Math.min(Math.ceil(drawDist / 4), 40);
              
              for (const p of pulsesOnConnection) {
                const isForward = p.fromIndex === i && p.toIndex === targetIdx;
                const isReverse = p.fromIndex === targetIdx && p.toIndex === i;
            
                if (!isForward && !isReverse) continue;
                
                const t = Math.min(p.progress, 1.0);
                const baseIntensity = p.strength * 1.0; // Volle Intensität für besseren Glow
                
                // PERFORMANCE: Initialisiere trailIntensities als Float32Array
                if (p.trailIntensities.length === 0) {
                  p.trailIntensities = new Float32Array(numSegments + 1);
                  p.lastHeadSegment = isForward ? -1 : numSegments + 1;
                }
                
                // TRAIL-EFFEKT MIT ZEIT-BASIERTEM DECAY
                if (isForward) {
                  const headSegment = Math.min(Math.floor(t * numSegments), numSegments);
                  
                  // Neue Segmente aktivieren (nur wenn noch nicht completed)
                  if (!p.completed && p.lastHeadSegment < headSegment) {
                    for (let seg = p.lastHeadSegment + 1; seg <= headSegment; seg++) {
                      if (seg >= 0 && seg < p.trailIntensities.length) {
                        p.trailIntensities[seg] = baseIntensity;
                      }
                    }
                  }
                  if (!p.completed) {
                    p.lastHeadSegment = headSegment;
                  }
                  
                  // Trail-Decay: ALLE Segmente klingen über Zeit ab
                  // PERFORMANCE: Optimiere Loop - nur aktive Segmente verarbeiten
                  const decayAmount = CONFIG.trailDecayPerSecond * deltaSeconds;
                  for (let seg = 0; seg < p.trailIntensities.length; seg++) {
                    const intensity = p.trailIntensities[seg];
                    if (intensity > 0) {
                      const newIntensity = intensity - decayAmount;
                      p.trailIntensities[seg] = newIntensity > 0 ? newIntensity : 0;
                    }
                  }
                  
                  // Kopf-Segment hat immer volle Intensität (nur wenn noch nicht completed)
                  if (!p.completed && headSegment >= 0 && headSegment < p.trailIntensities.length) {
                    p.trailIntensities[headSegment] = baseIntensity;
                  }
                  
                  // Sammle Intensitäten
                  for (let seg = 0; seg < p.trailIntensities.length; seg++) {
                    const intensity = p.trailIntensities[seg] || 0;
                    if (intensity > 0.01) {
                      const currentIntensity = segmentIntensities.get(seg) || 0;
                      segmentIntensities.set(seg, Math.max(currentIntensity, intensity));
                    }
                  }
                } else {
                  // Reverse: Impuls geht von target nach n
                  const headSegment = Math.max(Math.floor((1 - t) * numSegments), 0);
                  
                  // Neue Segmente aktivieren (nur wenn noch nicht completed)
                  if (!p.completed) {
                    if (p.lastHeadSegment > numSegments || p.lastHeadSegment > headSegment) {
                      if (p.lastHeadSegment > numSegments) {
                        p.lastHeadSegment = numSegments;
                      }
                      for (let seg = p.lastHeadSegment; seg >= headSegment; seg--) {
                        if (seg >= 0 && seg < p.trailIntensities.length) {
                          p.trailIntensities[seg] = baseIntensity;
                        }
                      }
                    }
                    p.lastHeadSegment = headSegment;
                  }
                  
                  // Trail-Decay
                  // PERFORMANCE: Optimiere Loop - nur aktive Segmente verarbeiten
                  const decayAmount = CONFIG.trailDecayPerSecond * deltaSeconds;
                  for (let seg = 0; seg < p.trailIntensities.length; seg++) {
                    const intensity = p.trailIntensities[seg];
                    if (intensity > 0) {
                      const newIntensity = intensity - decayAmount;
                      p.trailIntensities[seg] = newIntensity > 0 ? newIntensity : 0;
                    }
                  }
                  
                  // Kopf-Segment hat immer volle Intensität (nur wenn noch nicht completed)
                  if (!p.completed && headSegment >= 0 && headSegment < p.trailIntensities.length) {
                    p.trailIntensities[headSegment] = baseIntensity;
                  }
                  
                  // Sammle Intensitäten
                  for (let seg = 0; seg < p.trailIntensities.length; seg++) {
                    const intensity = p.trailIntensities[seg] || 0;
                    if (intensity > 0.01) {
                      const currentIntensity = segmentIntensities.get(seg) || 0;
                      segmentIntensities.set(seg, Math.max(currentIntensity, intensity));
                    }
                  }
                }
              }
            }
            
            // Schritt 2: Basis-Linie zeichnen (nur Segmente OHNE Glow)
            ctx.globalCompositeOperation = "source-over";
            if (segmentIntensities.size === 0) {
              // Keine aktiven Pulses - zeichne vollständige Basis-Linie
              ctx.strokeStyle = `rgba(${theme.neuron}, ${baseLineOpacity})`;
              ctx.lineWidth = lineWidth;
              ctx.beginPath();
              ctx.moveTo(n.x, n.y);
              ctx.lineTo(target.x, target.y);
              ctx.stroke();
            } else {
              // Zeichne Basis-Linie nur für Segmente ohne Glow
              ctx.strokeStyle = `rgba(${theme.neuron}, ${baseLineOpacity})`;
              ctx.lineWidth = lineWidth;
              
              let lastX = n.x;
              let lastY = n.y;
              let drawingPath = false;
              
              for (let seg = 0; seg <= numSegments; seg++) {
                const segT = seg / numSegments;
                const currentX = n.x + dx * segT;
                const currentY = n.y + dy * segT;
                const hasGlow = (segmentIntensities.get(seg) || 0) > 0.01;
                
                if (!hasGlow) {
                  // Kein Glow - Teil der Basis-Linie
                  if (!drawingPath) {
                    ctx.beginPath();
                    ctx.moveTo(lastX, lastY);
                    drawingPath = true;
                  }
                  ctx.lineTo(currentX, currentY);
                } else {
                  // Glow-Segment - beende Basis-Linie und starte neuen Abschnitt
                  if (drawingPath) {
                    ctx.stroke();
                    drawingPath = false;
                  }
                }
                
                lastX = currentX;
                lastY = currentY;
              }
              
              // Beende letzte Basis-Linie falls noch offen
              if (drawingPath) {
                ctx.stroke();
              }
            }
            
            // Schritt 3: NEON-GLOW-EFFEKT - Zeichne aktivierte Segmente mit Glow
            if (segmentIntensities.size > 0) {
              // PERFORMANCE: Setze globalCompositeOperation nur einmal
              ctx.globalCompositeOperation = "lighter";
              
              // GLOW-PHASE 1: Breiterer transparenter Halo für den Glow-Effekt
              let lastX = n.x;
              let lastY = n.y;
              let lastIntensity = segmentIntensities.get(0) || 0;
              
              // PERFORMANCE: Cache strokeStyle und lineWidth, setze nur bei Änderung
              let currentStrokeStyle = "";
              let currentLineWidth = 0;
              
              for (let seg = 1; seg <= numSegments; seg++) {
                const segT = seg / numSegments;
                const currentX = n.x + dx * segT;
                const currentY = n.y + dy * segT;
                const currentIntensity = segmentIntensities.get(seg) || 0;
                
                if (currentIntensity > 0.01 || lastIntensity > 0.01) {
                  const avgIntensity = (currentIntensity + lastIntensity) / 2;
                  if (avgIntensity > 0.01) {
                    // Glow-Halo: Breiterer, transparenterer Strich
                    const newStrokeStyle = `rgba(${theme.signal}, ${avgIntensity * 0.35})`;
                    const newLineWidth = 5 * Math.min(avgIntensity, 1.0);
                    
                    // PERFORMANCE: Setze nur bei Änderung
                    if (currentStrokeStyle !== newStrokeStyle) {
                      ctx.strokeStyle = newStrokeStyle;
                      currentStrokeStyle = newStrokeStyle;
                    }
                    if (currentLineWidth !== newLineWidth) {
                      ctx.lineWidth = newLineWidth;
                      currentLineWidth = newLineWidth;
                    }
                    
                    ctx.beginPath();
                    ctx.moveTo(lastX, lastY);
                    ctx.lineTo(currentX, currentY);
                    ctx.stroke();
                  }
                }
                
                lastX = currentX;
                lastY = currentY;
                lastIntensity = currentIntensity;
              }
              
              // GLOW-PHASE 2: Dünnerer, hellerer Kern
              lastX = n.x;
              lastY = n.y;
              lastIntensity = segmentIntensities.get(0) || 0;
              
              // PERFORMANCE: Reset Cache für Phase 2
              currentStrokeStyle = "";
              currentLineWidth = 0;
              
              for (let seg = 1; seg <= numSegments; seg++) {
                const segT = seg / numSegments;
                const currentX = n.x + dx * segT;
                const currentY = n.y + dy * segT;
                const currentIntensity = segmentIntensities.get(seg) || 0;
                
                if (currentIntensity > 0.01 || lastIntensity > 0.01) {
                  const avgIntensity = (currentIntensity + lastIntensity) / 2;
                  if (avgIntensity > 0.01) {
                    // Kern: Dünnerer, voller Alpha für maximale Helligkeit
                    const newStrokeStyle = `rgba(${theme.signal}, ${Math.min(avgIntensity, 1.0)})`;
                    const newLineWidth = 2 * Math.min(avgIntensity, 1.0);
                    
                    // PERFORMANCE: Setze nur bei Änderung
                    if (currentStrokeStyle !== newStrokeStyle) {
                      ctx.strokeStyle = newStrokeStyle;
                      currentStrokeStyle = newStrokeStyle;
                    }
                    if (currentLineWidth !== newLineWidth) {
                      ctx.lineWidth = newLineWidth;
                      currentLineWidth = newLineWidth;
                    }
                    
                    ctx.beginPath();
                    ctx.moveTo(lastX, lastY);
                    ctx.lineTo(currentX, currentY);
                    ctx.stroke();
                  }
                }
                
                lastX = currentX;
                lastY = currentY;
                lastIntensity = currentIntensity;
              }
            }
          }
        }
      }

      // 3. Neuronen 
      const isDark = theme === THEME_COLORS.dark;
      ctx.globalCompositeOperation = isDark ? "lighter" : "source-over";

      // PERFORMANCE: Cache fillStyle um unnötige Canvas-Property-Sets zu vermeiden
      let currentFillStyle = "";
      
      // PERFORMANCE: Pre-compute constants
      // SAFARI-OPTIMIERUNG: Weniger Blur-Layers für Safari Mac
      const baseParticleSize = CONFIG.particleSize;
      const zSizeScale = CONFIG.zSizeScale;
      const idlePulseEnabled = CONFIG.idlePulseEnabled;
      const idlePulseIntensity = CONFIG.idlePulseIntensity;
      const zBlurLayers = SAFARI_CONFIG.zBlurLayers;
      const neuronColor = theme.neuron;
      const signalColor = theme.signal;
      const sortedLength = visibleNeurons.length;
      
      for (let i = 0; i < sortedLength; i++) {
        const n = visibleNeurons[i];
        const zNormalized = normalizeZ(n.z);
        
        const sizeMultiplier = 1 + (zNormalized - 0.5) * zSizeScale;
        const particleSize = baseParticleSize * sizeMultiplier;
        
        let baseAlpha = isDark 
          ? 0.15 + n.flash * 0.5
          : 0.1 + n.flash * 0.35;
        
        // PERFORMANCE: Use fastSin lookup table
        if (idlePulseEnabled && n.flash < 0.01) {
          const pulseValue = fastSin(idlePulseTime + n.idlePulsePhase);
          const pulseModulation = 1 + (pulseValue * idlePulseIntensity);
          baseAlpha *= pulseModulation;
        }
        
        const zAlphaModifier = 0.7 + zNormalized * 0.3; 
        const alpha = baseAlpha * zAlphaModifier;
        
        const blurIntensity = zNormalized; 
        
        if (blurIntensity > 0.3) {
          // PERFORMANCE: Bitwise ceil approximation
          const baseLayers = blurIntensity > 0.7 
            ? ((blurIntensity * zBlurLayers) + 0.999) | 0
            : ((blurIntensity * zBlurLayers * 0.6) + 0.999) | 0;
          const numBlurLayers = baseLayers; 
          
          for (let layer = numBlurLayers; layer >= 1; layer--) {
            const layerAlpha = alpha * (layer / numBlurLayers) * 0.4; 
            const layerSize = particleSize * (1 + (numBlurLayers - layer + 1) * 0.3);
            
            // PERFORMANCE: Setze fillStyle nur bei Änderung
            const newFillStyle = `rgba(${neuronColor}, ${layerAlpha})`;
            if (currentFillStyle !== newFillStyle) {
              ctx.fillStyle = newFillStyle;
              currentFillStyle = newFillStyle;
            }
            
            ctx.beginPath();
            ctx.arc(n.x, n.y, layerSize, 0, TWO_PI);
            ctx.fill();
          }
        } else {
          // PERFORMANCE: Setze fillStyle nur bei Änderung
          const newFillStyle = `rgba(${neuronColor}, ${alpha})`;
          if (currentFillStyle !== newFillStyle) {
            ctx.fillStyle = newFillStyle;
            currentFillStyle = newFillStyle;
          }
          
          ctx.beginPath();
          ctx.arc(n.x, n.y, particleSize, 0, TWO_PI);
          ctx.fill();
        }

        if (n.flash > 0.01) {
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          
          const glowRadius = particleSize * 3 + (n.flash * 15 * sizeMultiplier);
          const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, glowRadius);
          
          const glowIntensity = zNormalized * 0.9 + 0.1;
          glow.addColorStop(0, `rgba(${signalColor}, ${n.flash * 0.9 * glowIntensity})`);
          glow.addColorStop(0.4, `rgba(${signalColor}, ${n.flash * 0.45 * glowIntensity})`);
          glow.addColorStop(1, `rgba(${signalColor}, 0)`);
          
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(n.x, n.y, glowRadius, 0, TWO_PI);
          ctx.fill();
          
          ctx.restore();
        } else if (idlePulseEnabled) {
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          
          // PERFORMANCE: Use fastSin lookup table
          const pulseValue = fastSin(idlePulseTime + n.idlePulsePhase);
          const pulseIntensity = (pulseValue + 1) * 0.5; // PERFORMANCE: * 0.5 statt / 2
          
          const idleGlowIntensity = idlePulseIntensity * 0.3; 
          const glowRadius = particleSize * 2 * (1 + pulseIntensity * 0.5);
          const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, glowRadius);
          
          const glowAlpha = idleGlowIntensity * pulseIntensity * (zNormalized * 0.5 + 0.5);
          glow.addColorStop(0, `rgba(${signalColor}, ${glowAlpha * 0.6})`);
          glow.addColorStop(0.5, `rgba(${signalColor}, ${glowAlpha * 0.3})`);
          glow.addColorStop(1, `rgba(${signalColor}, 0)`);
          
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(n.x, n.y, glowRadius, 0, TWO_PI);
          ctx.fill();
          
          ctx.restore();
        }
      }

      ctx.globalCompositeOperation = "source-over";
    };

    let lastFrameTime = performance.now();
    
    // SCROLL-THROTTLING: Reduziere FPS während des Scrollens für flüssigere UX
    // SAFARI-OPTIMIERUNG: Noch aggressiveres Throttling für Safari Mac
    let isScrolling = false;
    let scrollTimeout: NodeJS.Timeout | null = null;
    const SCROLL_IDLE_DELAY = SAFARI_CONFIG.scrollIdleDelay;
    
    // FPS-Einstellungen: Normal vs. Scroll-Modus (Safari-angepasst)
    const NORMAL_FPS = SAFARI_CONFIG.normalFPS;
    const SCROLL_FPS = SAFARI_CONFIG.scrollFPS;
    
    let currentTargetFPS = NORMAL_FPS;
    let frameInterval = 1000 / currentTargetFPS;
    
    // Scroll-Event-Handler
    const handleScroll = () => {
      if (!isScrolling) {
        isScrolling = true;
        currentTargetFPS = SCROLL_FPS;
        frameInterval = 1000 / currentTargetFPS;
      }
      
      // Reset Timeout bei jedem Scroll-Event
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      
      scrollTimeout = setTimeout(() => {
        isScrolling = false;
        currentTargetFPS = NORMAL_FPS;
        frameInterval = 1000 / currentTargetFPS;
      }, SCROLL_IDLE_DELAY);
    };
    
    // Passive Scroll-Listener für beste Performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    const loop = (currentTime: number = performance.now()) => {
      if (document.hidden) {
        lastFrameTime = currentTime;
        animationFrameId = requestAnimationFrame(loop);
        return;
      }
      
      const deltaTime = currentTime - lastFrameTime;
      
      // Dynamisches Frame-Limiting basierend auf Scroll-Status
      if (deltaTime < frameInterval * 0.8) {
        animationFrameId = requestAnimationFrame(loop);
        return;
      }
      
      // Begrenze deltaTime um Sprünge zu vermeiden
      const clampedDelta = Math.min(deltaTime, 100);
      const deltaSeconds = clampedDelta / 1000;
      
      lastFrameTime = currentTime;
      
      // SCROLL-OPTIMIERUNG: Überspringe Physics-Update während des Scrollens
      // (Die Neuronen "frieren" kurz ein, was kaum auffällt)
      if (!isScrolling) {
        updatePhysics(deltaSeconds);
      }
      
      if (CONFIG.idlePulseEnabled) {
        idlePulseTime += CONFIG.idlePulseSpeed * (deltaSeconds * 60);
      }
      
      draw(deltaSeconds);
      animationFrameId = requestAnimationFrame(loop);
    };

    const handleResize = () => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      
      resizeTimeout = setTimeout(() => {
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;
        
        const widthDiff = Math.abs(newWidth - lastResizeWidth);
        const heightDiff = Math.abs(newHeight - lastResizeHeight);
        
        if (widthDiff > 50 || heightDiff > 50 || lastResizeWidth === 0) {
          lastResizeWidth = newWidth;
          lastResizeHeight = newHeight;
          initNetwork();
        }
      }, 250);
    };

    // PERFORMANCE: Throttle Maus-Events mit requestAnimationFrame
    let mouseMoveRafId: number | null = null;
    const handleMouseMove = (e: MouseEvent) => {
      if (mouseMoveRafId !== null) return; // Bereits geplant
      
      mouseMoveRafId = requestAnimationFrame(() => {
        mouseRef.current = { 
          x: e.clientX, 
          y: e.clientY, 
          active: true 
        };
        mouseMoveRafId = null;
      });
    };
    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };
    const activateNeuron = (neuronIdx: number) => {
      const neurons = neuronsRef.current;
      if (neuronIdx < 0 || neuronIdx >= neurons.length) return;
      
      const startNode = neurons[neuronIdx];
      startNode.flash = 1.0;
      startNode.connections.forEach(targetIdx => {
        spawnPulse(neuronIdx, targetIdx, 1.0);
      });
    };

    const handleClick = (e: MouseEvent) => {
      const clickX = e.clientX;
      const clickY = e.clientY;
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

      if (closestIdx !== -1 && minDist < 150 * 150) {
        activateNeuron(closestIdx);
      }
    };

    // Automatischer Impuls-Handler
    let autoPulseTimeout: NodeJS.Timeout | null = null;
    let lastAutoPulseTime = 0; 

    const calculateAveragePulseLifetime = (): number => {
      // Absolute Pixel-Geschwindigkeit: Lebensdauer = Distanz / Geschwindigkeit
      // Verwende connectionDistance als Schätzung für durchschnittliche Verbindungslänge
      const avgDistance = CONFIG.connectionDistance;
      const singlePulseLifetimeMs = (avgDistance / CONFIG.signalSpeedPixelsPerSecond) * 1000;
      
      // Schätzung der Generationen basierend auf Decay
      const estimatedGenerations = 1 + (1 / (1 - CONFIG.signalDecay));
      const totalLifetime = singlePulseLifetimeMs * estimatedGenerations;
      
      return Math.max(totalLifetime, 1000);
    };

    const checkAndTriggerAutoPulse = () => {
      if (!CONFIG.autoPulseEnabled) return;
      
      const neurons = neuronsRef.current;
      const pulsePool = pulsePoolRef.current;
      const currentTime = Date.now();
      
      if (estimatedPulseLifetime === 0) {
        estimatedPulseLifetime = calculateAveragePulseLifetime();
      }
      
      // PERFORMANCE: Nutze Pool-Counter statt Array-Length
      const activePulseCount = pulsePool.count;
      const maxConcurrentPulses = 5; 
      
      const timeSinceLastPulse = lastAutoPulseTime > 0 ? currentTime - lastAutoPulseTime : Infinity;
      const triggerDelay = estimatedPulseLifetime * 0.8;
      
      const shouldTrigger = lastAutoPulseTime === 0 || 
        activePulseCount === 0 ||
        (timeSinceLastPulse >= triggerDelay && activePulseCount < maxConcurrentPulses);
      
      if (shouldTrigger) {
        const randomIdx = (Math.random() * neurons.length) | 0; // PERFORMANCE: Bitwise floor
        activateNeuron(randomIdx);
        lastAutoPulseTime = currentTime;
      }
      
      const checkInterval = activePulseCount === 0 
        ? 100 
        : Math.min(200, Math.max(triggerDelay - timeSinceLastPulse, 100)); 
      
      autoPulseTimeout = setTimeout(() => {
        checkAndTriggerAutoPulse();
      }, checkInterval);
    };

    const startAutoPulses = () => {
      if (CONFIG.autoPulseEnabled) {
        const initialDelay = 500; 
        autoPulseTimeout = setTimeout(() => {
          checkAndTriggerAutoPulse();
        }, initialDelay);
      }
    };

    initNetwork();
    lastResizeWidth = window.innerWidth;
    lastResizeHeight = window.innerHeight;
    lastFrameTime = performance.now();
    loop();
    startAutoPulses();

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("click", handleClick);

    return () => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      if (autoPulseTimeout) {
        clearTimeout(autoPulseTimeout);
      }
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      if (mouseMoveRafId !== null) {
        cancelAnimationFrame(mouseMoveRafId);
      }
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("click", handleClick);
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(animationFrameId);
      observer.disconnect(); 
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 -z-10"
      style={{
        opacity: 0, 
      }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{
          opacity: 0.4,  
          pointerEvents: "auto",
        }}
      />
    </div>
  );
}