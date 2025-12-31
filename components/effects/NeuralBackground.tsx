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
  signalLength: 100,          // Längerer Lichtschweif
  signalDecay: 0.5,           // Schnelleres Abklingen
  minSignalStrength: 0.15,    
  
  // Optik Basis
  particleSize: 1.8,
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

      // 1. Verbindungen (mit Z-abhängiger Opacity und Linienstärke)
      
      // Zeichne Verbindungen basierend auf durchschnittlicher Z-Position
      const connectionsDrawn = new Set<string>();
      for (let i = 0; i < neurons.length; i++) {
        const n = neurons[i];
        for (const targetIdx of n.connections) {
          if (targetIdx > i) {
            const target = neurons[targetIdx];
            const connectionKey = `${Math.min(i, targetIdx)}-${Math.max(i, targetIdx)}`;
            if (connectionsDrawn.has(connectionKey)) continue;
            connectionsDrawn.add(connectionKey);
            
            // Durchschnittliche Z-Position für diese Verbindung
            const avgZ = (n.z + target.z) / 2;
            const zNormalized = normalizeZ(avgZ);
            
            // Weitere Verbindungen = dünner und transparenter
            // Vordere Verbindungen = dicker und opaker
            const lineOpacity = theme.lineOpacity * (0.5 + zNormalized * 0.5);
            const lineWidth = 0.5 + zNormalized * 0.5;
            
            ctx.strokeStyle = `rgba(${theme.neuron}, ${lineOpacity})`;
            ctx.lineWidth = lineWidth;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(target.x, target.y);
            ctx.stroke();
          }
        }
      }

      // 2. Signale
      ctx.globalCompositeOperation = "lighter";
      
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i];
        const nA = neurons[p.fromIndex];
        const nB = neurons[p.toIndex];

        const dx = nB.x - nA.x;
        const dy = nB.y - nA.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        p.progress += CONFIG.signalSpeed;

        if (p.progress >= dist) {
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
          continue;
        }

        const t = p.progress / dist;
        const headX = nA.x + dx * t;
        const headY = nA.y + dy * t;
        
        const tailLen = Math.min(CONFIG.signalLength / dist, t);
        const tailX = nA.x + dx * (t - tailLen);
        const tailY = nA.y + dy * (t - tailLen);

        const gradient = ctx.createLinearGradient(tailX, tailY, headX, headY);
        gradient.addColorStop(0, `rgba(${theme.signal}, 0)`);
        // Reduzierte Signal-Intensität für subtilere Effekte
        gradient.addColorStop(1, `rgba(${theme.signal}, ${p.strength * 0.7})`);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2 * p.strength;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(headX, headY);
        ctx.stroke();
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
        const baseAlpha = isDark 
          ? 0.15 + n.flash * 0.5
          : 0.1 + n.flash * 0.35;
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
        }
      }

      ctx.globalCompositeOperation = "source-over";
    };

    const loop = () => {
      updatePhysics();
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
    let isAutoPulseActive = false;

    const checkAndTriggerAutoPulse = () => {
      if (!CONFIG.autoPulseEnabled || isAutoPulseActive) return;
      
      const neurons = neuronsRef.current;
      const pulses = pulsesRef.current;
      
      // Prüfe, ob alle Pulse abgeklungen sind (keine aktiven Pulse und keine Flashes)
      const hasActivePulses = pulses.length > 0;
      const hasActiveFlashes = neurons.some(n => n.flash > 0.01);
      
      if (!hasActivePulses && !hasActiveFlashes) {
        // Wähle ein zufälliges Neuron aus
        const randomIdx = Math.floor(Math.random() * neurons.length);
        activateNeuron(randomIdx);
        isAutoPulseActive = true;
        
        // Warte, bis der Impuls komplett abgeklungen ist
        const checkComplete = () => {
          const currentPulses = pulsesRef.current;
          const currentNeurons = neuronsRef.current;
          const stillHasPulses = currentPulses.length > 0;
          const stillHasFlashes = currentNeurons.some(n => n.flash > 0.01);
          
          if (!stillHasPulses && !stillHasFlashes) {
            isAutoPulseActive = false;
            // Warte eine zufällige Zeit, bevor der nächste Impuls kommt
            const delay = CONFIG.autoPulseMinDelay + 
              Math.random() * (CONFIG.autoPulseMaxDelay - CONFIG.autoPulseMinDelay);
            autoPulseTimeout = setTimeout(() => {
              checkAndTriggerAutoPulse();
            }, delay);
          } else {
            // Prüfe erneut nach kurzer Zeit
            requestAnimationFrame(checkComplete);
          }
        };
        
        // Starte die Überwachung nach kurzer Verzögerung
        setTimeout(() => {
          requestAnimationFrame(checkComplete);
        }, 100);
      } else {
        // Prüfe erneut nach kurzer Zeit
        autoPulseTimeout = setTimeout(checkAndTriggerAutoPulse, 500);
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