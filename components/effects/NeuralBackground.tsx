"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

/**
 * CONFIG: Physics & Grid
 */
const CONFIG = {
  // Gitter & Dichte
  neuronDensity: 0.0008,     
  connectionDistance: 120,    // Etwas erhöht, da sie sich mehr bewegen
  viewportPadding: 200,       // Padding außerhalb des Viewports für Neuronen
  gridCellSize: 150,          // Größe der Grid-Zellen für gleichmäßige Verteilung
  
  // "Freies Schwimmen" (Viereck vergrößert)
  wanderRadius: 1,          // DEUTLICH erhöht (war 0.5) -> Mehr Freiheit
  wanderSpeed: 0.015,         // Langsamerer, eleganter Richtungswechsel
  springStiffness: 0.04,     // Sehr weiche Feder (war 0.008) -> Lässt weite Wege zu
  
  // Sanfte Maus-Interaktion
  mouseInteractionRadius: 250, 
  mouseForce: 0.003,          // GANZ sanft (war 0.02) -> Nur eine Ahnung von Bewegung
  damping: 0.95,              // Sehr ölig/gleitend
  
  // Signale
  signalSpeed: 4.0,           
  signalLength: 120,          // Längerer Lichtschweif
  signalDecay: 0.6,           // Schnelleres Abklingen
  minSignalStrength: 0.15,    
  
  // Optik Basis
  particleSize: 2,
  flashDecay: 0.04,
  
  // 3D Z-Dimension
  zDepthRange: 400,           // Z-Tiefe Bereich (-zDepthRange/2 bis +zDepthRange/2)
  zBaseOffset: 0,             // Basis-Z-Position (0 = Mitte)
  zSizeScale: 0.8,            // Größenänderung pro Z-Einheit (größer = mehr Unterschied)
  zBlurLayers: 3,             // Anzahl überlagerter Kreise für Blur-Effekt
  
  // Auto-Impulse
  autoPulseEnabled: true,     // Automatische Impulse aktivieren
  autoPulseMinDelay: 2000,    // Mindestverzögerung zwischen Impulsen (ms)
  autoPulseMaxDelay: 4000,    // Maximale Verzögerung zwischen Impulsen (ms)
  
  // Ruhe-Puls-Animation (subtile neuronale Aktivität)
  idlePulseEnabled: true,     // Ruhe-Puls-Animation aktivieren
  idlePulseIntensity: 0.6,    // Sehr dezent (60% der Intensität eines Klicks)
  idlePulseSpeed: 0.2,        // Langsame Puls-Geschwindigkeit
};

// Farb-Konfigurationen für Light/Dark
const THEME_COLORS = {
  dark: {
    neuron: "255, 255, 255", // Weiß
    signal: "255, 92, 0",    // Leuchtendes Orange
    lineOpacity: 0.06,       // Reduziert von 0.12 für subtileres Netzwerk
  },
  light: {
    neuron: "10, 10, 10",    // Fast Schwarz (Tinte)
    signal: "235, 80, 0",    // Etwas dunkleres Orange für Kontrast auf Weiß
    lineOpacity: 0.04,         // Reduziert von 0.08 für subtileres Netzwerk
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
  idlePulsePhase: number; // Phase für subtile Ruhe-Puls-Animation (0-2π)
}

interface Pulse {
  id: number;
  fromIndex: number;
  toIndex: number;
  progress: number;
  totalDist: number;
  strength: number;
}

export default function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Refs für State, der nicht neu rendern soll
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });
  const neuronsRef = useRef<Neuron[]>([]);
  const pulsesRef = useRef<Pulse[]>([]);
  const pulseIdCounter = useRef(0);
  
  // Ref für das aktuelle Farb-Theme (Mutable, damit Animation Loop zugreifen kann)
  const themeRef = useRef(THEME_COLORS.dark);

  // Fade-in nach Hero-Animation
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
    if (!canvas) return () => {}; // Cleanup-Funktion auch bei early return

    // Performance: desynchronized reduziert Latenz zwischen Rendering und Anzeige
    const ctx = canvas.getContext("2d", { 
      alpha: true,
      desynchronized: true, // Reduziert Latenz, verbessert Frame-Timing
      willReadFrequently: false // Optimiert für Write-Only Canvas
    });
    if (!ctx) return () => {}; // Cleanup-Funktion auch bei early return

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let lastResizeWidth = 0;
    let lastResizeHeight = 0;
    let resizeTimeout: NodeJS.Timeout | null = null;
    let idlePulseTime = 0; // Zeit-Variable für Ruhe-Puls-Animation

    // Performance: Adaptive Quality & FPS-Tracking
    let frameCount = 0;
    let lastFPSUpdate = performance.now();
    let currentFPS = 60;
    let qualityLevel = 1.0; // 1.0 = voll, 0.5 = reduziert
    
    // Auto-Pulse State (muss außerhalb initNetwork sein)
    let estimatedPulseLifetime = 0; // Geschätzte Lebensdauer eines Pulses (in ms)

    // --- 0. Theme Detection ---
    const updateTheme = () => {
      const isDark = document.documentElement.classList.contains("dark");
      themeRef.current = isDark ? THEME_COLORS.dark : THEME_COLORS.light;
    };

    // Observer, der auf Klassenänderungen am HTML-Tag achtet (Light/Dark Switch)
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    updateTheme(); // Initial call

    // --- 1. Init Network ---
    const initNetwork = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      // Erweiterte Bereiche für Neuronen-Platzierung (inkl. Padding außerhalb des Viewports)
      const extendedWidth = width + (CONFIG.viewportPadding * 2);
      const extendedHeight = height + (CONFIG.viewportPadding * 2);
      const area = width * height; // Berechne Dichte basierend auf sichtbarem Bereich
      const baseNumNeurons = Math.floor(area * CONFIG.neuronDensity);
      
      const newNeurons: Neuron[] = [];

      // Grid-basierte Verteilung für gleichmäßige Abdeckung
      const gridCols = Math.ceil(extendedWidth / CONFIG.gridCellSize);
      const gridRows = Math.ceil(extendedHeight / CONFIG.gridCellSize);
      
      // Platziere mindestens ein Neuron pro Grid-Zelle
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
            idlePulsePhase: Math.random() * Math.PI * 2, // Zufällige Phase für Variation
          });
        }
      }
      
      // Füge zusätzliche Neuronen hinzu, um die gewünschte Dichte zu erreichen
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
          idlePulsePhase: Math.random() * Math.PI * 2, // Zufällige Phase für Variation
        });
      }

      // Jedes Neuron bekommt genau 3 Verbindungen zu den 3 nächsten Nachbarn
      const numNeurons = newNeurons.length;
      for (let i = 0; i < numNeurons; i++) {
        const distances: Array<{ index: number; dist: number }> = [];
        
        // Berechne Distanzen zu allen anderen Neuronen
        for (let j = 0; j < numNeurons; j++) {
          if (i === j) continue;
          const dx = newNeurons[i].x - newNeurons[j].x;
          const dy = newNeurons[i].y - newNeurons[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          distances.push({ index: j, dist });
        }
        
        // Sortiere nach Distanz
        distances.sort((a, b) => a.dist - b.dist);
        
        // Finde die 3 nächsten verfügbaren Nachbarn (die noch nicht voll sind)
        let connectionsAdded = 0;
        for (const neighbor of distances) {
          if (connectionsAdded >= 3) break;
          
          // Prüfe ob bereits verbunden
          if (newNeurons[i].connections.includes(neighbor.index)) continue;
          
          // Erstelle bidirektionale Verbindung
          newNeurons[i].connections.push(neighbor.index);
          if (!newNeurons[neighbor.index].connections.includes(i)) {
            newNeurons[neighbor.index].connections.push(i);
          }
          connectionsAdded++;
        }
      }

      neuronsRef.current = newNeurons;
      pulsesRef.current = [];
      
      // Setze geschätzte Lebensdauer zurück, damit sie neu berechnet wird
      estimatedPulseLifetime = 0;
    };

    const spawnPulse = (fromIdx: number, toIdx: number, strength: number) => {
      pulsesRef.current.push({
        id: pulseIdCounter.current++,
        fromIndex: fromIdx,
        toIndex: toIdx,
        progress: 0,
        totalDist: 0,
        strength: strength
      });
    };

    // --- 2. Physik ---
    const updatePhysics = () => {
      const neurons = neuronsRef.current;
      const mouse = mouseRef.current;

      // Performance: Cache Maus-Distanz-Berechnung für alle Neuronen
      const mouseSquared = mouse.active ? CONFIG.mouseInteractionRadius * CONFIG.mouseInteractionRadius : 0;

      for (let i = 0; i < neurons.length; i++) {
        const n = neurons[i];

        // A. Weiträumiges Wandern (Größeres Viereck)
        n.wanderAngle += (Math.random() - 0.5) * CONFIG.wanderSpeed;
        const wanderX = Math.cos(n.wanderAngle) * CONFIG.wanderRadius;
        const wanderY = Math.sin(n.wanderAngle) * CONFIG.wanderRadius;
        
        n.vx += wanderX;
        n.vy += wanderY;

        // B. Sehr weiche Rückfederung
        const dxBase = n.baseX - n.x;
        const dyBase = n.baseY - n.y;
        const dzBase = n.baseZ - n.z;
        n.vx += dxBase * CONFIG.springStiffness;
        n.vy += dyBase * CONFIG.springStiffness;
        n.vz += dzBase * CONFIG.springStiffness;

        // C. Subtile Maus-Interaktion (Performance: Verwende squared distance)
        if (mouse.active && mouseSquared > 0) {
          const dxMouse = mouse.x - n.x;
          const dyMouse = mouse.y - n.y;
          const distMouseSquared = dxMouse * dxMouse + dyMouse * dyMouse;

          // Performance: Vermeide sqrt wenn außerhalb des Radius
          if (distMouseSquared < mouseSquared) {
            const distMouse = Math.sqrt(distMouseSquared);
            const force = (1 - distMouse / CONFIG.mouseInteractionRadius) * CONFIG.mouseForce;
            n.vx += dxMouse * force; 
            n.vy += dyMouse * force;
          }
        }

        n.vx *= CONFIG.damping;
        n.vy *= CONFIG.damping;
        n.vz *= CONFIG.damping;
        n.x += n.vx;
        n.y += n.vy;
        n.z += n.vz;

        if (n.flash > 0) {
          n.flash -= CONFIG.flashDecay;
          if (n.flash < 0) n.flash = 0;
        }
      }
    };

    // --- 3. Rendering ---
    // Hilfsfunktion: Normalisiere Z-Position zu einem 0-1 Wert (0 = ganz hinten, 1 = ganz vorne)
    const normalizeZ = (z: number): number => {
      const normalized = (z - CONFIG.zBaseOffset + CONFIG.zDepthRange / 2) / CONFIG.zDepthRange;
      return Math.max(0, Math.min(1, normalized));
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      
      const neurons = neuronsRef.current;
      const pulses = pulsesRef.current;
      const theme = themeRef.current; // Aktuelles Farbschema nutzen

      // Viewport Culling: Nur Neuronen im sichtbaren Bereich + Padding rendern
      // Adaptive Padding basierend auf Quality-Level
      const viewportPadding = 100 * qualityLevel; // Reduziertes Padding bei niedriger Qualität
      const visibleBounds = {
        left: -viewportPadding,
        right: width + viewportPadding,
        top: -viewportPadding,
        bottom: height + viewportPadding,
      };

      // Filtere sichtbare Neuronen (nur für Rendering, Physik läuft weiter)
      const visibleNeurons = neurons.filter(n => 
        n.x >= visibleBounds.left && 
        n.x <= visibleBounds.right && 
        n.y >= visibleBounds.top && 
        n.y <= visibleBounds.bottom
      );

      // Erstelle eine sortierte Kopie der sichtbaren Neuronen (hinten zuerst für korrektes Z-Buffering)
      // Sortiere nur wenn nötig (weniger Neuronen = schneller)
      const sortedNeurons = visibleNeurons.sort((a, b) => a.z - b.z);

      // 1. Update Pulse Progress (muss vor dem Rendering passieren)
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i];
        const nA = neurons[p.fromIndex];
        const nB = neurons[p.toIndex];

        const dx = nB.x - nA.x;
        const dy = nB.y - nA.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Speichere die ursprüngliche Distanz beim ersten Mal (für konsistente Progress-Berechnung)
        if (p.totalDist === 0) {
          p.totalDist = dist;
        }
        
        p.progress += CONFIG.signalSpeed;

        // Verwende die ursprüngliche Distanz für die Completion-Prüfung
        if (p.progress >= p.totalDist) {
          pulses.splice(i, 1);
          nB.flash = 1.0 * p.strength;

          if (p.strength * CONFIG.signalDecay > CONFIG.minSignalStrength) {
            const newStrength = p.strength * CONFIG.signalDecay;
            nB.connections.forEach(neighborIdx => {
              // Verhindere Rücksignal zum ursprünglichen Sender
              if (neighborIdx !== p.fromIndex) {
                spawnPulse(p.toIndex, neighborIdx, newStrength);
              }
            });
          }
        }
      }

      // 2. Verbindungen mit leuchtenden Segmenten basierend auf Pulsen
      ctx.globalCompositeOperation = "lighter";
      
      // Gruppiere Pulse nach Verbindungen
      const connectionPulses = new Map<string, Pulse[]>();
      for (const p of pulses) {
        const connectionKey = `${Math.min(p.fromIndex, p.toIndex)}-${Math.max(p.fromIndex, p.toIndex)}`;
        if (!connectionPulses.has(connectionKey)) {
          connectionPulses.set(connectionKey, []);
        }
        connectionPulses.get(connectionKey)!.push(p);
      }

      // Performance: Batching von Basis-Verbindungen (gleiche Farbe/Dicke)
      // Sammle alle Basis-Verbindungen und gruppiere sie nach ähnlicher Opacity/LineWidth
      interface BaseConnection {
        x1: number;
        y1: number;
        x2: number;
        y2: number;
        opacity: number;
        lineWidth: number;
        connectionKey: string;
      }
      
      const baseConnections: BaseConnection[] = [];
      const connectionsDrawn = new Set<string>();
      
      // Erstelle Set mit Indizes der sichtbaren Neuronen
      const visibleNeuronIndices = new Set<number>();
      for (let i = 0; i < neurons.length; i++) {
        const n = neurons[i];
        if (n.x >= visibleBounds.left && 
            n.x <= visibleBounds.right && 
            n.y >= visibleBounds.top && 
            n.y <= visibleBounds.bottom) {
          visibleNeuronIndices.add(i);
        }
      }

      // Sammle alle Basis-Verbindungen
      for (let i = 0; i < neurons.length; i++) {
        if (!visibleNeuronIndices.has(i)) continue;
        
        const n = neurons[i];
        for (const targetIdx of n.connections) {
          if (targetIdx > i) {
            if (!visibleNeuronIndices.has(targetIdx)) continue;
            
            const target = neurons[targetIdx];
            const connectionKey = `${i}-${targetIdx}`;
            if (connectionsDrawn.has(connectionKey)) continue;
            connectionsDrawn.add(connectionKey);
            
            const avgZ = (n.z + target.z) / 2;
            const zNormalized = normalizeZ(avgZ);
            const baseLineOpacity = theme.lineOpacity * (0.5 + zNormalized * 0.5);
            const baseLineWidth = 0.5 + zNormalized * 0.5;
            const lineWidth = baseLineWidth * 1.4;
            
            baseConnections.push({
              x1: n.x,
              y1: n.y,
              x2: target.x,
              y2: target.y,
              opacity: baseLineOpacity,
              lineWidth: lineWidth,
              connectionKey: connectionKey
            });
          }
        }
      }
      
      // Performance: Batch-Rendering - Gruppiere nach ähnlicher Opacity/LineWidth
      // Runde Opacity und LineWidth für besseres Batching
      const batchedConnections = new Map<string, BaseConnection[]>();
      for (const conn of baseConnections) {
        // Runde auf 0.01 für besseres Batching
        const roundedOpacity = Math.round(conn.opacity * 100) / 100;
        const roundedWidth = Math.round(conn.lineWidth * 10) / 10;
        const batchKey = `${roundedOpacity}_${roundedWidth}`;
        
        if (!batchedConnections.has(batchKey)) {
          batchedConnections.set(batchKey, []);
        }
        batchedConnections.get(batchKey)!.push(conn);
      }
      
      // Zeichne alle Basis-Verbindungen in Batches
      ctx.globalCompositeOperation = "source-over";
      for (const [batchKey, connections] of batchedConnections) {
        if (connections.length === 0) continue;
        
        const firstConn = connections[0];
        ctx.strokeStyle = `rgba(${theme.neuron}, ${firstConn.opacity})`;
        ctx.lineWidth = firstConn.lineWidth;
        
        // Zeichne alle Verbindungen dieser Batch-Gruppe in einem beginPath/stroke
        ctx.beginPath();
        for (const conn of connections) {
          ctx.moveTo(conn.x1, conn.y1);
          ctx.lineTo(conn.x2, conn.y2);
        }
        ctx.stroke();
      }
      
      // Jetzt die Pulse-Segmente für jede Verbindung
      for (const conn of baseConnections) {
            
        // Zeichne leuchtende Segmente basierend auf Pulsen
        const pulsesOnConnection = connectionPulses.get(conn.connectionKey) || [];
        if (pulsesOnConnection.length > 0) {
          ctx.globalCompositeOperation = "lighter";
          
          const dx = conn.x2 - conn.x1;
          const dy = conn.y2 - conn.y1;
          const totalDist = Math.sqrt(dx * dx + dy * dy);
          
          // Erstelle ein Array von Segmenten mit kumulativer Intensität
          const segmentIntensities = new Map<number, number>();
          
          // Parse connectionKey um Indizes zu erhalten
          const [idx1, idx2] = conn.connectionKey.split('-').map(Number);
          
          for (const p of pulsesOnConnection) {
            // Prüfe die Richtung des Pulses
            const isForward = p.fromIndex === idx1 && p.toIndex === idx2;
            const isReverse = p.fromIndex === idx2 && p.toIndex === idx1;
            
            if (!isForward && !isReverse) continue;
            
            // Normalisiere Progress basierend auf ursprünglicher Distanz
            const t = Math.min(p.progress / (p.totalDist || totalDist), 1.0);
            const intensity = p.strength * 0.7;
            
            // Performance: Adaptive Segmente basierend auf Quality-Level
            const segmentDensity = qualityLevel > 0.7 ? 3 : (qualityLevel > 0.5 ? 4 : 5);
            const maxSegments = qualityLevel > 0.7 ? 60 : (qualityLevel > 0.5 ? 40 : 30);
            const numSegments = Math.min(Math.ceil(totalDist / segmentDensity), maxSegments);
            
            if (isForward) {
              const maxSegment = Math.floor(t * numSegments);
              for (let seg = 0; seg <= maxSegment; seg++) {
                const currentIntensity = segmentIntensities.get(seg) || 0;
                segmentIntensities.set(seg, currentIntensity + intensity);
              }
            } else {
              const startSegment = Math.floor((1 - t) * numSegments);
              for (let seg = startSegment; seg <= numSegments; seg++) {
                const currentIntensity = segmentIntensities.get(seg) || 0;
                segmentIntensities.set(seg, currentIntensity + intensity);
              }
            }
          }
          
          // Batch-Rendering: Sammle alle Segmente
          if (segmentIntensities.size > 0) {
            const segmentDensity = qualityLevel > 0.7 ? 3 : (qualityLevel > 0.5 ? 4 : 5);
            const maxSegments = qualityLevel > 0.7 ? 60 : (qualityLevel > 0.5 ? 40 : 30);
            const numSegments = Math.min(Math.ceil(totalDist / segmentDensity), maxSegments);
            
            const segments: Array<{x1: number, y1: number, x2: number, y2: number, intensity: number}> = [];
            let lastX = conn.x1;
            let lastY = conn.y1;
            let lastIntensity = 0;
            
            for (let seg = 0; seg <= numSegments; seg++) {
              const segT = seg / numSegments;
              const currentX = conn.x1 + dx * segT;
              const currentY = conn.y1 + dy * segT;
              const currentIntensity = segmentIntensities.get(seg) || 0;
              
              if (currentIntensity > 0 || lastIntensity > 0) {
                const avgIntensity = (currentIntensity + lastIntensity) / 2;
                if (avgIntensity > 0) {
                  segments.push({
                    x1: lastX,
                    y1: lastY,
                    x2: currentX,
                    y2: currentY,
                    intensity: avgIntensity
                  });
                }
              }
              
              lastX = currentX;
              lastY = currentY;
              lastIntensity = currentIntensity;
            }
            
            // Performance: Batch-Rendering - Gruppiere Pulse-Segmente nach ähnlicher Intensität
            if (segments.length > 0) {
              // Gruppiere nach gerundeter Intensität für besseres Batching
              const intensityBatches = new Map<number, typeof segments>();
              for (const seg of segments) {
                const roundedIntensity = Math.round(seg.intensity * 20) / 20; // Runde auf 0.05
                if (!intensityBatches.has(roundedIntensity)) {
                  intensityBatches.set(roundedIntensity, []);
                }
                intensityBatches.get(roundedIntensity)!.push(seg);
              }
              
              // Zeichne alle Segmente gruppiert nach Intensität
              for (const [intensity, segs] of intensityBatches) {
                ctx.strokeStyle = `rgba(${theme.signal}, ${Math.min(intensity, 1.0)})`;
                ctx.lineWidth = 2 * Math.min(intensity, 1.0);
                
                ctx.beginPath();
                for (const seg of segs) {
                  ctx.moveTo(seg.x1, seg.y1);
                  ctx.lineTo(seg.x2, seg.y2);
                }
                ctx.stroke();
              }
            }
          }
        }
      }

      // 3. Neuronen (sortiert nach Z: hinten zuerst, damit vordere über hinten gezeichnet werden)
      const isDark = theme === THEME_COLORS.dark;
      ctx.globalCompositeOperation = isDark ? "lighter" : "source-over";

      // Rendere Neuronen von hinten nach vorne (depth sorting)
      for (let i = 0; i < sortedNeurons.length; i++) {
        const n = sortedNeurons[i];
        const zNormalized = normalizeZ(n.z);
        
        // Größe basierend auf Z-Position: weiter vorne = größer
        // zNormalized: 0 (hinten) bis 1 (vorne)
        const sizeMultiplier = 1 + (zNormalized - 0.5) * CONFIG.zSizeScale;
        const particleSize = CONFIG.particleSize * sizeMultiplier;
        
        // Opacity: weiter hinten = etwas transparenter, weiter vorne = etwas opaker
        let baseAlpha = isDark 
          ? 0.15 + n.flash * 0.5
          : 0.1 + n.flash * 0.35;
        
        // Subtile Ruhe-Puls-Animation (nur wenn kein Flash aktiv ist)
        if (CONFIG.idlePulseEnabled && n.flash < 0.01) {
          const pulseValue = Math.sin(idlePulseTime + n.idlePulsePhase);
          // Puls-Intensität: 0 = keine Änderung, 1 = maximale Intensität
          // Verwende (pulseValue + 1) / 2, um von -1..1 zu 0..1 zu mappen
          // Dann multipliziere mit der Intensität für subtile Modulation
          const pulseModulation = 1 + (pulseValue * CONFIG.idlePulseIntensity);
          baseAlpha *= pulseModulation;
        }
        
        const zAlphaModifier = 0.7 + zNormalized * 0.3; // 0.7-1.0 Range
        const alpha = baseAlpha * zAlphaModifier;
        
        // Blur-Effekt für vordere Neuronen: mehrere überlagerte Kreise mit abnehmender Opacity
        // weiter vorne (zNormalized näher bei 1) = mehr Blur-Layers
        // Performance: Adaptive Blur-Layers basierend auf Quality-Level
        const blurIntensity = zNormalized; // 0 = kein Blur, 1 = maximaler Blur
        
        if (blurIntensity > 0.3) {
          // Zeichne mehrere überlagerte Kreise für Blur-Effekt
          // Performance: Adaptive Layers basierend auf Quality-Level und Z-Position
          const baseLayers = blurIntensity > 0.7 
            ? Math.ceil(blurIntensity * CONFIG.zBlurLayers) 
            : Math.ceil(blurIntensity * CONFIG.zBlurLayers * 0.6);
          const numBlurLayers = Math.ceil(baseLayers * qualityLevel); // Reduziert bei niedriger Qualität
          
          for (let layer = numBlurLayers; layer >= 1; layer--) {
            const layerAlpha = alpha * (layer / numBlurLayers) * 0.4; // Abnehmende Opacity pro Layer
            const layerSize = particleSize * (1 + (numBlurLayers - layer + 1) * 0.3);
            
            ctx.fillStyle = `rgba(${theme.neuron}, ${layerAlpha})`;
            ctx.beginPath();
            ctx.arc(n.x, n.y, layerSize, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          // Kein Blur für hinten liegende Neuronen - scharfe Darstellung
          ctx.fillStyle = `rgba(${theme.neuron}, ${alpha})`;
          ctx.beginPath();
          ctx.arc(n.x, n.y, particleSize, 0, Math.PI * 2);
          ctx.fill();
        }

        // Flash Glow (Immer die Signalfarbe, auch Z-abhängig)
        if (n.flash > 0.01) {
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          
          // Glow-Größe basierend auf Z-Position
          const glowRadius = particleSize * 3 + (n.flash * 15 * sizeMultiplier);
          const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, glowRadius);
          
          // Glow-Intensität basierend auf Z-Position
          const glowIntensity = zNormalized * 0.9 + 0.1;
          glow.addColorStop(0, `rgba(${theme.signal}, ${n.flash * 0.9 * glowIntensity})`);
          glow.addColorStop(0.4, `rgba(${theme.signal}, ${n.flash * 0.45 * glowIntensity})`);
          glow.addColorStop(1, `rgba(${theme.signal}, 0)`);
          
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(n.x, n.y, glowRadius, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.restore();
        } else if (CONFIG.idlePulseEnabled) {
          // Subtiler Ruhe-Puls-Glow (nur wenn kein Flash aktiv ist)
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          
          const pulseValue = Math.sin(idlePulseTime + n.idlePulsePhase);
          // Puls-Intensität: 0 = keine Änderung, 1 = maximale Intensität
          const pulseIntensity = (pulseValue + 1) / 2; // 0..1
          
          // Sehr subtiler Glow (viel schwächer als Flash)
          const idleGlowIntensity = CONFIG.idlePulseIntensity * 0.3; // Noch dezentere Intensität
          const glowRadius = particleSize * 2 * (1 + pulseIntensity * 0.5);
          const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, glowRadius);
          
          const glowAlpha = idleGlowIntensity * pulseIntensity * (zNormalized * 0.5 + 0.5);
          glow.addColorStop(0, `rgba(${theme.signal}, ${glowAlpha * 0.6})`);
          glow.addColorStop(0.5, `rgba(${theme.signal}, ${glowAlpha * 0.3})`);
          glow.addColorStop(1, `rgba(${theme.signal}, 0)`);
          
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(n.x, n.y, glowRadius, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.restore();
        }
      }

      ctx.globalCompositeOperation = "source-over";
    };

    // Performance: Frame-Skipping für niedrige FPS-Geräte + Adaptive Quality
    let lastFrameTime = performance.now();
    const targetFPS = 60;
    const frameInterval = 1000 / targetFPS;
    
    const loop = (currentTime: number = performance.now()) => {
      // Performance: Pausiere Animation wenn Tab im Hintergrund
      if (document.hidden) {
        animationFrameId = requestAnimationFrame(loop);
        return;
      }
      
      const deltaTime = currentTime - lastFrameTime;
      
      // Skip Frame wenn zu schnell (Performance-Optimierung)
      if (deltaTime < frameInterval * 0.8) {
        animationFrameId = requestAnimationFrame(loop);
        return;
      }
      
      lastFrameTime = currentTime;
      
      // FPS-Tracking für adaptive Quality (vereinfacht, weniger Overhead)
      frameCount++;
      if (currentTime - lastFPSUpdate >= 2000) { // Update alle 2 Sekunden (weniger Overhead)
        currentFPS = frameCount / 2; // FPS = frames / 2 seconds
        frameCount = 0;
        lastFPSUpdate = currentTime;
        
        // Adaptive Quality: Reduziere Qualität wenn FPS < 50
        if (currentFPS < 45) {
          qualityLevel = Math.max(0.5, qualityLevel - 0.15); // Größere Schritte
        } else if (currentFPS >= 55) {
          qualityLevel = Math.min(1.0, qualityLevel + 0.1); // Größere Schritte
        }
      }
      
      updatePhysics();
      // Aktualisiere Zeit für Ruhe-Puls-Animation
      if (CONFIG.idlePulseEnabled) {
        idlePulseTime += CONFIG.idlePulseSpeed;
      }
      draw();
      animationFrameId = requestAnimationFrame(loop);
    };

    const handleResize = () => {
      // Debounce: Warte 250ms, bevor wir reagieren
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      
      resizeTimeout = setTimeout(() => {
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;
        
        // Nur neu initialisieren, wenn sich die Größe signifikant geändert hat
        // (mehr als 50px Unterschied in Breite oder Höhe)
        // Dies verhindert Neuinitialisierung bei kleinen Viewport-Änderungen
        // wie beim Scrollen auf mobilen Geräten oder Pull-to-Refresh
        const widthDiff = Math.abs(newWidth - lastResizeWidth);
        const heightDiff = Math.abs(newHeight - lastResizeHeight);
        
        if (widthDiff > 50 || heightDiff > 50 || lastResizeWidth === 0) {
          lastResizeWidth = newWidth;
          lastResizeHeight = newHeight;
          initNetwork();
        }
      }, 250);
    };
    // Performance: Optimiertes Maus-Event-Handling für besseren INP
    // Direkte Updates ohne Throttling für minimale Latenz
    const handleMouseMove = (e: MouseEvent) => {
      // Direktes Update ohne jegliches Throttling für minimale Presentation Delay
      // Die Physik-Engine ist bereits optimiert und kann mit hoher Event-Rate umgehen
      mouseRef.current = { 
        x: e.clientX, 
        y: e.clientY, 
        active: true 
      };
    };
    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };
    // Funktion zum Aktivieren eines Neurons (wird von Click und Auto-Pulse verwendet)
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
    let lastAutoPulseTime = 0; // Zeitpunkt des letzten automatischen Pulses

    // Berechne die durchschnittliche Lebensdauer eines Pulses basierend auf Verbindungsdistanzen
    const calculateAveragePulseLifetime = (): number => {
      const neurons = neuronsRef.current;
      if (neurons.length === 0) return 2000; // Fallback-Wert
      
      let totalDist = 0;
      let connectionCount = 0;
      
      for (let i = 0; i < neurons.length; i++) {
        const n = neurons[i];
        for (const targetIdx of n.connections) {
          if (targetIdx > i) {
            const target = neurons[targetIdx];
            const dx = target.x - n.x;
            const dy = target.y - n.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            totalDist += dist;
            connectionCount++;
          }
        }
      }
      
      if (connectionCount === 0) return 2000; // Fallback-Wert
      
      const avgDist = totalDist / connectionCount;
      // Lebensdauer = Distanz / Signalgeschwindigkeit (in Frames)
      // Umrechnung zu ms: Frames * (1000 / 60) für 60 FPS
      const lifetimeInFrames = avgDist / CONFIG.signalSpeed;
      const lifetimeInMs = lifetimeInFrames * (1000 / 60);
      
      // Berücksichtige Signal-Decay (mehrere Generationen)
      // Schätze durchschnittlich 2-3 Generationen basierend auf signalDecay
      const estimatedGenerations = 1 + (1 / (1 - CONFIG.signalDecay));
      const totalLifetime = lifetimeInMs * estimatedGenerations;
      
      // Stelle sicher, dass die Lebensdauer mindestens 1000ms beträgt
      return Math.max(totalLifetime, 1000);
    };

    const checkAndTriggerAutoPulse = () => {
      if (!CONFIG.autoPulseEnabled) return;
      
      const neurons = neuronsRef.current;
      const pulses = pulsesRef.current;
      const currentTime = Date.now();
      
      // Berechne die erwartete Lebensdauer, wenn noch nicht gesetzt oder Netzwerk neu initialisiert wurde
      if (estimatedPulseLifetime === 0) {
        estimatedPulseLifetime = calculateAveragePulseLifetime();
      }
      
      // Zähle alle aktiven Pulse
      const activePulseCount = pulses.length;
      const maxConcurrentPulses = 5; // Maximal 5 gleichzeitige Pulse (inkl. weitergeleitete)
      
      // Prüfe, ob 80% der Lebensdauer seit dem letzten Pulse vergangen sind
      const timeSinceLastPulse = lastAutoPulseTime > 0 ? currentTime - lastAutoPulseTime : Infinity;
      const triggerDelay = estimatedPulseLifetime * 0.8;
      
      // Starte ein neues Signal, wenn:
      // 1. Noch kein Signal gestartet wurde (lastAutoPulseTime === 0)
      // 2. Oder keine Pulse mehr aktiv sind (damit immer mindestens ein Signal sichtbar ist)
      // 3. Oder 80% der Lebensdauer vergangen sind UND die Anzahl aktiver Pulse niedrig ist
      const shouldTrigger = lastAutoPulseTime === 0 || 
        activePulseCount === 0 ||
        (timeSinceLastPulse >= triggerDelay && activePulseCount < maxConcurrentPulses);
      
      if (shouldTrigger) {
        // Wähle ein zufälliges Neuron aus
        const randomIdx = Math.floor(Math.random() * neurons.length);
        activateNeuron(randomIdx);
        lastAutoPulseTime = currentTime;
      }
      
      // Plane den nächsten Check - prüfe regelmäßig
      // Wenn keine Pulse aktiv sind, prüfe schnell (100ms)
      // Sonst prüfe alle 200ms oder wenn 80% der Lebensdauer erreicht sind
      const checkInterval = activePulseCount === 0 
        ? 100 // Schnell prüfen, wenn keine Pulse aktiv sind
        : Math.min(200, Math.max(triggerDelay - timeSinceLastPulse, 100)); // Regelmäßig prüfen
      
      autoPulseTimeout = setTimeout(() => {
        checkAndTriggerAutoPulse();
      }, checkInterval);
    };

    // Starte automatische Impulse nach einer initialen Verzögerung
    const startAutoPulses = () => {
      if (CONFIG.autoPulseEnabled) {
        // Starte mit einer kurzen initialen Verzögerung, damit das Netzwerk initialisiert ist
        const initialDelay = 500; // 500ms initiale Verzögerung
        autoPulseTimeout = setTimeout(() => {
          // Beim ersten Check sollte sofort ein Signal gestartet werden (lastAutoPulseTime === 0)
          checkAndTriggerAutoPulse();
        }, initialDelay);
      }
    };

    initNetwork();
    // Speichere die initiale Größe
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
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("click", handleClick);
      cancelAnimationFrame(animationFrameId);
      observer.disconnect(); // Observer aufräumen
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 -z-10"
      style={{
        opacity: 0, // Startet unsichtbar, wird nach Hero-Animation eingeblendet
      }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{
          opacity: 0.4,  // Reduziert von 0.6 für subtileres Netzwerk
          pointerEvents: "auto",
        }}
      />
    </div>
  );
}