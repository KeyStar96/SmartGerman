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
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let lastResizeWidth = 0;
    let lastResizeHeight = 0;
    let resizeTimeout: NodeJS.Timeout | null = null;
    let idlePulseTime = 0; // Zeit-Variable für Ruhe-Puls-Animation

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

        // C. Subtile Maus-Interaktion
        if (mouse.active) {
          const dxMouse = mouse.x - n.x;
          const dyMouse = mouse.y - n.y;
          const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

          if (distMouse < CONFIG.mouseInteractionRadius) {
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

      // Erstelle eine sortierte Kopie der Neuronen (hinten zuerst für korrektes Z-Buffering)
      const sortedNeurons = [...neurons].sort((a, b) => a.z - b.z);

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

      // Zeichne Verbindungen mit leuchtenden Segmenten
      const connectionsDrawn = new Set<string>();
      for (let i = 0; i < neurons.length; i++) {
        const n = neurons[i];
        for (const targetIdx of n.connections) {
          if (targetIdx > i) {
            const target = neurons[targetIdx];
            const connectionKey = `${i}-${targetIdx}`;
            if (connectionsDrawn.has(connectionKey)) continue;
            connectionsDrawn.add(connectionKey);
            
            // Durchschnittliche Z-Position für diese Verbindung
            const avgZ = (n.z + target.z) / 2;
            const zNormalized = normalizeZ(avgZ);
            
            // Basis-Linienopacity (nicht leuchtend)
            const baseLineOpacity = theme.lineOpacity * (0.5 + zNormalized * 0.5);
            const baseLineWidth = 0.5 + zNormalized * 0.5;
            const lineWidth = baseLineWidth * 1.4;
            
            // Zeichne Basis-Verbindung (nicht leuchtend)
            ctx.globalCompositeOperation = "source-over";
            ctx.strokeStyle = `rgba(${theme.neuron}, ${baseLineOpacity})`;
            ctx.lineWidth = lineWidth;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(target.x, target.y);
            ctx.stroke();
            
            // Zeichne leuchtende Segmente basierend auf Pulsen
            const pulsesOnConnection = connectionPulses.get(connectionKey) || [];
            if (pulsesOnConnection.length > 0) {
              ctx.globalCompositeOperation = "lighter";
              
              const dx = target.x - n.x;
              const dy = target.y - n.y;
              const totalDist = Math.sqrt(dx * dx + dy * dy);
              
              // Erstelle ein Array von Segmenten mit kumulativer Intensität
              // Jedes Segment repräsentiert einen Punkt auf der Linie mit seiner Gesamtintensität
              const segmentIntensities = new Map<number, number>();
              
              for (const p of pulsesOnConnection) {
                // Prüfe die Richtung des Pulses
                // Die Verbindung wird immer von i zu targetIdx gerendert (i < targetIdx)
                // Wenn p.fromIndex === i, dann geht der Pulse von i zu targetIdx (korrekte Richtung)
                // Wenn p.fromIndex === targetIdx, dann geht der Pulse von targetIdx zu i (umgekehrte Richtung)
                const isForward = p.fromIndex === i && p.toIndex === targetIdx;
                const isReverse = p.fromIndex === targetIdx && p.toIndex === i;
                
                if (!isForward && !isReverse) continue; // Pulse gehört nicht zu dieser Verbindung
                
                // Normalisiere Progress basierend auf ursprünglicher Distanz
                const t = Math.min(p.progress / (p.totalDist || totalDist), 1.0);
                const intensity = p.strength * 0.7;
                
                // Wir diskretisieren die Linie in kleine Segmente für glatte Darstellung
                const numSegments = Math.ceil(totalDist / 2); // Ein Segment alle 2 Pixel
                
                if (isForward) {
                  // Pulse geht von i zu targetIdx (von 0 zu 1 in unserer Rendering-Richtung)
                  // Leuchte von 0 bis t (hinter dem Pulse)
                  const maxSegment = Math.floor(t * numSegments);
                  for (let seg = 0; seg <= maxSegment; seg++) {
                    const currentIntensity = segmentIntensities.get(seg) || 0;
                    segmentIntensities.set(seg, currentIntensity + intensity);
                  }
                } else {
                  // Pulse geht von targetIdx zu i (von 1 zu 0 in unserer Rendering-Richtung)
                  // Leuchte von t bis 1 (hinter dem Pulse, der sich von 1 zu 0 bewegt)
                  // t=0 bedeutet am targetIdx (Position 1), t=1 bedeutet am i (Position 0)
                  // Also müssen wir von (1-t) bis 1 leuchten
                  const startSegment = Math.floor((1 - t) * numSegments);
                  for (let seg = startSegment; seg <= numSegments; seg++) {
                    const currentIntensity = segmentIntensities.get(seg) || 0;
                    segmentIntensities.set(seg, currentIntensity + intensity);
                  }
                }
              }
              
              // Zeichne die leuchtenden Segmente
              if (segmentIntensities.size > 0) {
                const numSegments = Math.ceil(totalDist / 2);
                let lastX = n.x;
                let lastY = n.y;
                let lastIntensity = 0;
                
                for (let seg = 0; seg <= numSegments; seg++) {
                  const segT = seg / numSegments;
                  const currentX = n.x + dx * segT;
                  const currentY = n.y + dy * segT;
                  const currentIntensity = segmentIntensities.get(seg) || 0;
                  
                  // Zeichne Segment nur wenn Intensität vorhanden
                  if (currentIntensity > 0 || lastIntensity > 0) {
                    const avgIntensity = (currentIntensity + lastIntensity) / 2;
                    if (avgIntensity > 0) {
                      ctx.strokeStyle = `rgba(${theme.signal}, ${Math.min(avgIntensity, 1.0)})`;
                      ctx.lineWidth = 2 * Math.min(avgIntensity, 1.0);
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
        const blurIntensity = zNormalized; // 0 = kein Blur, 1 = maximaler Blur
        
        if (blurIntensity > 0.1) {
          // Zeichne mehrere überlagerte Kreise für Blur-Effekt
          const numBlurLayers = Math.ceil(blurIntensity * CONFIG.zBlurLayers);
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

    const loop = () => {
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
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY, active: true };
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
    let estimatedPulseLifetime = 0; // Geschätzte Lebensdauer eines Pulses (in ms)

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
      
      return totalLifetime;
    };

    const checkAndTriggerAutoPulse = () => {
      if (!CONFIG.autoPulseEnabled) return;
      
      const neurons = neuronsRef.current;
      const currentTime = Date.now();
      
      // Berechne die erwartete Lebensdauer, wenn noch nicht gesetzt oder Netzwerk neu initialisiert wurde
      if (estimatedPulseLifetime === 0) {
        estimatedPulseLifetime = calculateAveragePulseLifetime();
      }
      
      // Prüfe, ob 80% der Lebensdauer seit dem letzten Pulse vergangen sind
      const timeSinceLastPulse = currentTime - lastAutoPulseTime;
      const triggerDelay = estimatedPulseLifetime * 0.8;
      
      if (timeSinceLastPulse >= triggerDelay || lastAutoPulseTime === 0) {
        // Wähle ein zufälliges Neuron aus
        const randomIdx = Math.floor(Math.random() * neurons.length);
        activateNeuron(randomIdx);
        lastAutoPulseTime = currentTime;
        
        // Plane den nächsten Check nach 80% der Lebensdauer
        autoPulseTimeout = setTimeout(() => {
          checkAndTriggerAutoPulse();
        }, triggerDelay);
      } else {
        // Prüfe erneut nach kurzer Zeit, bis 80% erreicht sind
        const remainingTime = triggerDelay - timeSinceLastPulse;
        autoPulseTimeout = setTimeout(() => {
          checkAndTriggerAutoPulse();
        }, Math.min(remainingTime, 100)); // Maximal 100ms zwischen Checks
      }
    };

    // Starte automatische Impulse nach einer initialen Verzögerung
    const startAutoPulses = () => {
      if (CONFIG.autoPulseEnabled) {
        const initialDelay = CONFIG.autoPulseMinDelay + 
          Math.random() * (CONFIG.autoPulseMaxDelay - CONFIG.autoPulseMinDelay);
        autoPulseTimeout = setTimeout(() => {
          checkAndTriggerAutoPulse();
        }, initialDelay);
      }
    };

    initNetwork();
    // Speichere die initiale Größe
    lastResizeWidth = window.innerWidth;
    lastResizeHeight = window.innerHeight;
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