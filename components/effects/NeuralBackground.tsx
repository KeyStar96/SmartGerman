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
  // signalSpeedPerSecond: Wie viel Prozent der Verbindung pro Sekunde zurückgelegt wird
  signalSpeedPerSecond: 0.8,  // 80% der Verbindungslänge pro Sekunde
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
  trailDecayPerSecond: 0.6,  // Intensität pro Sekunde, die abgezogen wird (reduziert für länger sichtbaren Trail)
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
  trailIntensities: number[];
  lastHeadSegment: number;  // Letztes Segment, das der Kopf erreicht hat
}

export default function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });
  const neuronsRef = useRef<Neuron[]>([]);
  const pulsesRef = useRef<Pulse[]>([]);
  const pulseIdCounter = useRef(0);
  
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
      // Begrenzt die Render-Auflösung auf max 1.5x. 
      // Auf Retina-Screens (3x) spart das ca. 75% Pixelberechnung.
      // --------------------------------------------------------
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      
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
      for (let i = 0; i < numNeurons; i++) {
        const distances: Array<{ index: number; dist: number }> = [];
        
        for (let j = 0; j < numNeurons; j++) {
          if (i === j) continue;
          const dx = newNeurons[i].x - newNeurons[j].x;
          const dy = newNeurons[i].y - newNeurons[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          distances.push({ index: j, dist });
        }
        
        distances.sort((a, b) => a.dist - b.dist);
        
        let connectionsAdded = 0;
        for (const neighbor of distances) {
          if (connectionsAdded >= 3) break;
          
          if (newNeurons[i].connections.includes(neighbor.index)) continue;
          
          newNeurons[i].connections.push(neighbor.index);
          if (!newNeurons[neighbor.index].connections.includes(i)) {
            newNeurons[neighbor.index].connections.push(i);
          }
          connectionsAdded++;
        }
      }

      neuronsRef.current = newNeurons;
      pulsesRef.current = [];
      estimatedPulseLifetime = 0;
    };

    const spawnPulse = (fromIdx: number, toIdx: number, strength: number) => {
      pulsesRef.current.push({
        id: pulseIdCounter.current++,
        fromIndex: fromIdx,
        toIndex: toIdx,
        progress: 0,
        totalDist: 0,
        strength: strength,
        trailIntensities: [],  // Wird beim ersten Draw initialisiert
        lastHeadSegment: -1,
      });
    };

    // --- 2. Physik (Zeit-basiert für konsistente Animation) ---
    const updatePhysics = (deltaSeconds: number) => {
      const neurons = neuronsRef.current;
      const mouse = mouseRef.current;
      
      // Normalisierungsfaktor: Physik war für 60fps ausgelegt
      const timeScale = deltaSeconds * 60;

      const mouseSquared = mouse.active ? CONFIG.mouseInteractionRadius * CONFIG.mouseInteractionRadius : 0;

      for (let i = 0; i < neurons.length; i++) {
        const n = neurons[i];

        n.wanderAngle += (Math.random() - 0.5) * CONFIG.wanderSpeed * timeScale;
        const wanderX = Math.cos(n.wanderAngle) * CONFIG.wanderRadius;
        const wanderY = Math.sin(n.wanderAngle) * CONFIG.wanderRadius;
        
        n.vx += wanderX * timeScale;
        n.vy += wanderY * timeScale;

        const dxBase = n.baseX - n.x;
        const dyBase = n.baseY - n.y;
        const dzBase = n.baseZ - n.z;
        n.vx += dxBase * CONFIG.springStiffness * timeScale;
        n.vy += dyBase * CONFIG.springStiffness * timeScale;
        n.vz += dzBase * CONFIG.springStiffness * timeScale;

        if (mouse.active && mouseSquared > 0) {
          const dxMouse = mouse.x - n.x;
          const dyMouse = mouse.y - n.y;
          const distMouseSquared = dxMouse * dxMouse + dyMouse * dyMouse;

          if (distMouseSquared < mouseSquared) {
            const distMouse = Math.sqrt(distMouseSquared);
            const force = (1 - distMouse / CONFIG.mouseInteractionRadius) * CONFIG.mouseForce;
            n.vx += dxMouse * force * timeScale; 
            n.vy += dyMouse * force * timeScale;
          }
        }

        // Damping mit Zeit-Skalierung
        const dampingFactor = Math.pow(CONFIG.damping, timeScale);
        n.vx *= dampingFactor;
        n.vy *= dampingFactor;
        n.vz *= dampingFactor;
        n.x += n.vx * timeScale;
        n.y += n.vy * timeScale;
        n.z += n.vz * timeScale;

        // Flash-Decay ist jetzt zeit-basiert
        if (n.flash > 0) {
          n.flash -= CONFIG.flashDecayPerSecond * deltaSeconds;
          if (n.flash < 0) n.flash = 0;
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
      const pulses = pulsesRef.current;
      const theme = themeRef.current; 

      const viewportPadding = 100; 
      const visibleBounds = {
        left: -viewportPadding,
        right: width + viewportPadding,
        top: -viewportPadding,
        bottom: height + viewportPadding,
      };

      const visibleNeurons = neurons.filter(n => 
        n.x >= visibleBounds.left && 
        n.x <= visibleBounds.right && 
        n.y >= visibleBounds.top && 
        n.y <= visibleBounds.bottom
      );

      const sortedNeurons = visibleNeurons.sort((a, b) => a.z - b.z);

      // 1. Update Pulse Progress (ZEIT-BASIERT für konsistente Geschwindigkeit)
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i];
        const nA = neurons[p.fromIndex];
        const nB = neurons[p.toIndex];

        const dx = nB.x - nA.x;
        const dy = nB.y - nA.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (p.totalDist === 0) {
          p.totalDist = dist;
        }
        
        // ZEIT-BASIERT: Progress ist 0-1 (Prozent der Verbindungslänge)
        p.progress += CONFIG.signalSpeedPerSecond * deltaSeconds;

        if (p.progress >= 1.0) {
          pulses.splice(i, 1);
          nB.flash = 1.0 * p.strength;

          if (p.strength * CONFIG.signalDecay > CONFIG.minSignalStrength) {
            const newStrength = p.strength * CONFIG.signalDecay;
            nB.connections.forEach(neighborIdx => {
              if (neighborIdx !== p.fromIndex) {
                spawnPulse(p.toIndex, neighborIdx, newStrength);
              }
            });
          }
        }
      }

      // 2. Verbindungen 
      ctx.globalCompositeOperation = "lighter";
      
      const connectionPulses = new Map<string, Pulse[]>();
      for (const p of pulses) {
        const connectionKey = `${Math.min(p.fromIndex, p.toIndex)}-${Math.max(p.fromIndex, p.toIndex)}`;
        if (!connectionPulses.has(connectionKey)) {
          connectionPulses.set(connectionKey, []);
        }
        connectionPulses.get(connectionKey)!.push(p);
      }

      const connectionsDrawn = new Set<string>();
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
            
            const dx = target.x - n.x;
            const dy = target.y - n.y;
            const currentDist = Math.sqrt(dx * dx + dy * dy);
            
            const pulsesOnConnection = connectionPulses.get(connectionKey) || [];
            let numSegments = Math.min(Math.ceil(currentDist / 3), 50);
            const segmentIntensities = new Map<number, number>();
            const hasActivePulses = pulsesOnConnection.length > 0;
            
            // Schritt 1: Pulse-Trails berechnen und Intensitäten sammeln
            if (hasActivePulses) {
              // Verwende totalDist vom ersten Pulse für konsistente Segment-Anzahl
              const drawDist = pulsesOnConnection[0].totalDist > 0 ? pulsesOnConnection[0].totalDist : currentDist;
              numSegments = Math.min(Math.ceil(drawDist / 3), 50);
              
              for (const p of pulsesOnConnection) {
                const isForward = p.fromIndex === i && p.toIndex === targetIdx;
                const isReverse = p.fromIndex === targetIdx && p.toIndex === i;
            
                if (!isForward && !isReverse) continue;
                
                const t = Math.min(p.progress, 1.0);
                const baseIntensity = p.strength * 1.0; // Volle Intensität für besseren Glow
                
                // Initialisiere trailIntensities nur beim ersten Frame
                if (p.trailIntensities.length === 0) {
                  p.trailIntensities = new Array(numSegments + 1).fill(0);
                  p.lastHeadSegment = isForward ? -1 : numSegments + 1;
                }
                
                // TRAIL-EFFEKT MIT ZEIT-BASIERTEM DECAY
                if (isForward) {
                  const headSegment = Math.min(Math.floor(t * numSegments), numSegments);
                  
                  // Neue Segmente aktivieren
                  if (p.lastHeadSegment < headSegment) {
                    for (let seg = p.lastHeadSegment + 1; seg <= headSegment; seg++) {
                      if (seg >= 0 && seg < p.trailIntensities.length) {
                        p.trailIntensities[seg] = baseIntensity;
                      }
                    }
                  }
                  p.lastHeadSegment = headSegment;
                  
                  // Trail-Decay: ALLE Segmente klingen über Zeit ab
                  for (let seg = 0; seg < p.trailIntensities.length; seg++) {
                    if (p.trailIntensities[seg] > 0) {
                      p.trailIntensities[seg] -= CONFIG.trailDecayPerSecond * deltaSeconds;
                      if (p.trailIntensities[seg] < 0) p.trailIntensities[seg] = 0;
                    }
                  }
                  
                  // Kopf-Segment hat immer volle Intensität
                  if (headSegment >= 0 && headSegment < p.trailIntensities.length) {
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
                  
                  // Trail-Decay
                  for (let seg = 0; seg < p.trailIntensities.length; seg++) {
                    if (p.trailIntensities[seg] > 0) {
                      p.trailIntensities[seg] -= CONFIG.trailDecayPerSecond * deltaSeconds;
                      if (p.trailIntensities[seg] < 0) p.trailIntensities[seg] = 0;
                    }
                  }
                  
                  if (headSegment >= 0 && headSegment < p.trailIntensities.length) {
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
              ctx.globalCompositeOperation = "lighter";
              
              // GLOW-PHASE 1: Breiterer transparenter Halo für den Glow-Effekt
              let lastX = n.x;
              let lastY = n.y;
              let lastIntensity = segmentIntensities.get(0) || 0;
              
              for (let seg = 1; seg <= numSegments; seg++) {
                const segT = seg / numSegments;
                const currentX = n.x + dx * segT;
                const currentY = n.y + dy * segT;
                const currentIntensity = segmentIntensities.get(seg) || 0;
                
                if (currentIntensity > 0.01 || lastIntensity > 0.01) {
                  const avgIntensity = (currentIntensity + lastIntensity) / 2;
                  if (avgIntensity > 0.01) {
                    // Glow-Halo: Breiterer, transparenterer Strich
                    ctx.strokeStyle = `rgba(${theme.signal}, ${avgIntensity * 0.35})`;
                    ctx.lineWidth = 7 * Math.min(avgIntensity, 1.0);
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
              
              for (let seg = 1; seg <= numSegments; seg++) {
                const segT = seg / numSegments;
                const currentX = n.x + dx * segT;
                const currentY = n.y + dy * segT;
                const currentIntensity = segmentIntensities.get(seg) || 0;
                
                if (currentIntensity > 0.01 || lastIntensity > 0.01) {
                  const avgIntensity = (currentIntensity + lastIntensity) / 2;
                  if (avgIntensity > 0.01) {
                    // Kern: Dünnerer, voller Alpha für maximale Helligkeit
                    ctx.strokeStyle = `rgba(${theme.signal}, ${Math.min(avgIntensity, 1.0)})`;
                    ctx.lineWidth = 2.5 * Math.min(avgIntensity, 1.0);
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

      for (let i = 0; i < sortedNeurons.length; i++) {
        const n = sortedNeurons[i];
        const zNormalized = normalizeZ(n.z);
        
        const sizeMultiplier = 1 + (zNormalized - 0.5) * CONFIG.zSizeScale;
        const particleSize = CONFIG.particleSize * sizeMultiplier;
        
        let baseAlpha = isDark 
          ? 0.15 + n.flash * 0.5
          : 0.1 + n.flash * 0.35;
        
        if (CONFIG.idlePulseEnabled && n.flash < 0.01) {
          const pulseValue = Math.sin(idlePulseTime + n.idlePulsePhase);
          const pulseModulation = 1 + (pulseValue * CONFIG.idlePulseIntensity);
          baseAlpha *= pulseModulation;
        }
        
        const zAlphaModifier = 0.7 + zNormalized * 0.3; 
        const alpha = baseAlpha * zAlphaModifier;
        
        const blurIntensity = zNormalized; 
        
        if (blurIntensity > 0.3) {
          const baseLayers = blurIntensity > 0.7 
            ? Math.ceil(blurIntensity * CONFIG.zBlurLayers) 
            : Math.ceil(blurIntensity * CONFIG.zBlurLayers * 0.6);
          const numBlurLayers = baseLayers; 
          
          for (let layer = numBlurLayers; layer >= 1; layer--) {
            const layerAlpha = alpha * (layer / numBlurLayers) * 0.4; 
            const layerSize = particleSize * (1 + (numBlurLayers - layer + 1) * 0.3);
            
            ctx.fillStyle = `rgba(${theme.neuron}, ${layerAlpha})`;
            ctx.beginPath();
            ctx.arc(n.x, n.y, layerSize, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          ctx.fillStyle = `rgba(${theme.neuron}, ${alpha})`;
          ctx.beginPath();
          ctx.arc(n.x, n.y, particleSize, 0, Math.PI * 2);
          ctx.fill();
        }

        if (n.flash > 0.01) {
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          
          const glowRadius = particleSize * 3 + (n.flash * 15 * sizeMultiplier);
          const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, glowRadius);
          
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
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          
          const pulseValue = Math.sin(idlePulseTime + n.idlePulsePhase);
          const pulseIntensity = (pulseValue + 1) / 2; 
          
          const idleGlowIntensity = CONFIG.idlePulseIntensity * 0.3; 
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

    let lastFrameTime = performance.now();
    const targetFPS = 60;
    const frameInterval = 1000 / targetFPS;
    
    const loop = (currentTime: number = performance.now()) => {
      if (document.hidden) {
        lastFrameTime = currentTime; // Reset timer when tab becomes visible again
        animationFrameId = requestAnimationFrame(loop);
        return;
      }
      
      const deltaTime = currentTime - lastFrameTime;
      
      // Frame-Limiting für Performance, aber deltaTime wird trotzdem korrekt berechnet
      if (deltaTime < frameInterval * 0.8) {
        animationFrameId = requestAnimationFrame(loop);
        return;
      }
      
      // Begrenze deltaTime um Sprünge nach Tab-Wechsel zu vermeiden
      const clampedDelta = Math.min(deltaTime, 100); // Max 100ms pro Frame
      const deltaSeconds = clampedDelta / 1000;
      
      lastFrameTime = currentTime;
      
      updatePhysics(deltaSeconds);
      if (CONFIG.idlePulseEnabled) {
        idlePulseTime += CONFIG.idlePulseSpeed * (deltaSeconds * 60); // Normalisiert auf 60fps
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

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { 
        x: e.clientX, 
        y: e.clientY, 
        active: true 
      };
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
      // Da die Geschwindigkeit jetzt zeit-basiert ist (Prozent pro Sekunde),
      // ist die Lebensdauer eines einzelnen Pulses: 1 / signalSpeedPerSecond Sekunden
      const singlePulseLifetimeMs = (1 / CONFIG.signalSpeedPerSecond) * 1000;
      
      // Schätzung der Generationen basierend auf Decay
      const estimatedGenerations = 1 + (1 / (1 - CONFIG.signalDecay));
      const totalLifetime = singlePulseLifetimeMs * estimatedGenerations;
      
      return Math.max(totalLifetime, 1000);
    };

    const checkAndTriggerAutoPulse = () => {
      if (!CONFIG.autoPulseEnabled) return;
      
      const neurons = neuronsRef.current;
      const pulses = pulsesRef.current;
      const currentTime = Date.now();
      
      if (estimatedPulseLifetime === 0) {
        estimatedPulseLifetime = calculateAveragePulseLifetime();
      }
      
      const activePulseCount = pulses.length;
      const maxConcurrentPulses = 5; 
      
      const timeSinceLastPulse = lastAutoPulseTime > 0 ? currentTime - lastAutoPulseTime : Infinity;
      const triggerDelay = estimatedPulseLifetime * 0.8;
      
      const shouldTrigger = lastAutoPulseTime === 0 || 
        activePulseCount === 0 ||
        (timeSinceLastPulse >= triggerDelay && activePulseCount < maxConcurrentPulses);
      
      if (shouldTrigger) {
        const randomIdx = Math.floor(Math.random() * neurons.length);
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
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("click", handleClick);
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