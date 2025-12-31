"use client";

import { useEffect, useRef } from "react";

// Konfiguration - Zeit-basiert statt Frame-basiert
const CONFIG = {
  neuronsPerSquarePixel: 0.0000375, // Dichte: Neuronen pro Quadratpixel
  baseSpeed: 0.3, // Bewegungsgeschwindigkeit der Neuronen (Pixel pro Sekunde)
  signalSpeedCmPerSec: 8, // Signalgeschwindigkeit in cm/s
  pixelsPerCm: 37.8, // Pixel pro cm (bei 96 DPI)
  initialDelay: 5000, // 5 Sekunden Startverzögerung (in ms)
  pauseBetweenSignals: 5000, // 5 Sekunden Pause zwischen Signalen (in ms)
  chargeDuration: 1000, // 1 Sekunde Aufladung (in ms)
  originChargeDuration: 1500, // 1.5 Sekunden Aufladung für Ursprungsneuron (in ms)
  maxConnectionsPerNeuron: 5, // Maximale Anzahl der Verbindungen pro Neuron
  viewportPadding: 0.2, // 20% Padding außerhalb des sichtbaren Bereichs
  signalDecayRate: 0.15, // Leuchtkraft-Verlust pro Verbindung (15% pro Hop)
  beamLength: 30, // Länge des Lichtstrahls in Pixeln
  gridCellSize: 100, // Größe der Grid-Zellen für Spatial Partitioning (in Pixeln)
  particleTrailCount: 4, // Anzahl der Partikel im Schweif
  colors: {
    base: "rgba(1, 42, 46, 0.6)", // --dm-surface-teal (abgedunkelt)
    line: "rgba(56, 62, 78, 0.15)", // --dm-border-slate (sehr dezent)
    signal: "rgba(255, 255, 255, 0.8)", // Weiß für Signale
    neuronActive: "#FF5C00", // --primary-orange für aktive Neuronen
    neuronGlow: "rgba(255, 255, 255, 0.9)", // Weiß für aufleuchtende Neuronen
  },
};

interface Point {
  x: number;
  y: number;
  vx: number;
  vy: number;
  chargeTimer: number; // Timer für das Aufladen (in ms)
  intensity: number; // Leuchtkraft des Neurons (0.0 bis 1.0)
  connections: number[]; // Indizes der verbundenen Neuronen
  colorValue: number; // Wert zwischen 0 (Cyan) und 1 (Orange) für Farbvariation
  gridX: number; // Grid-X-Position für Spatial Partitioning
  gridY: number; // Grid-Y-Position für Spatial Partitioning
}

interface Signal {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  progress: number; // 0.0 bis 1.0
  totalDistance: number; // Gesamtdistanz in Pixeln
  connectionKey: string; // Eindeutiger Key für die Verbindung
  intensity: number; // Leuchtkraft des Signals (0.0 bis 1.0)
  targetIndex: number; // Index des Ziel-Neurons
  sourceIndex: number; // Index des Quell-Neurons
  speed: number; // Pixel pro Millisekunde
  trail: Array<{ x: number; y: number; opacity: number }>; // Partikel-Schweif
}

// Spatial Partitioning Grid-System
class SpatialGrid {
  private grid: Map<string, number[]> = new Map();
  private cellSize: number;

  constructor(cellSize: number) {
    this.cellSize = cellSize;
  }

  private getCellKey(x: number, y: number): string {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX},${cellY}`;
  }

  clear() {
    this.grid.clear();
  }

  add(particleIndex: number, x: number, y: number) {
    const key = this.getCellKey(x, y);
    if (!this.grid.has(key)) {
      this.grid.set(key, []);
    }
    this.grid.get(key)!.push(particleIndex);
  }

  getNeighbors(x: number, y: number, radius: number = 1): number[] {
    const neighbors: number[] = [];
    const startCellX = Math.floor((x - radius * this.cellSize) / this.cellSize);
    const endCellX = Math.floor((x + radius * this.cellSize) / this.cellSize);
    const startCellY = Math.floor((y - radius * this.cellSize) / this.cellSize);
    const endCellY = Math.floor((y + radius * this.cellSize) / this.cellSize);

    for (let cellX = startCellX; cellX <= endCellX; cellX++) {
      for (let cellY = startCellY; cellY <= endCellY; cellY++) {
        const key = `${cellX},${cellY}`;
        const cell = this.grid.get(key);
        if (cell) {
          neighbors.push(...cell);
        }
      }
    }

    return neighbors;
  }
}

export default function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Canvas nur Viewport-Größe (fixed position)
    const dpr = window.devicePixelRatio || 1;
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Berechne erweiterten Bereich für Neuronen (außerhalb des sichtbaren Bereichs)
    let paddingX = width * CONFIG.viewportPadding;
    let paddingY = height * CONFIG.viewportPadding;
    let minX = -paddingX;
    let maxX = width + paddingX;
    let minY = -paddingY;
    let maxY = height + paddingY;

    // Berechne Fläche für Neuronen-Verteilung (inkl. Padding)
    const totalArea = (maxX - minX) * (maxY - minY);

    // Berechne Anzahl der Neuronen basierend auf Dichte
    const particleCount = Math.max(50, Math.floor(totalArea * CONFIG.neuronsPerSquarePixel));

    // Neuronen initialisieren
    const particles: Point[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: minX + Math.random() * (maxX - minX),
        y: minY + Math.random() * (maxY - minY),
        vx: (Math.random() - 0.5) * CONFIG.baseSpeed,
        vy: (Math.random() - 0.5) * CONFIG.baseSpeed,
        chargeTimer: 0,
        intensity: 0,
        connections: [],
        colorValue: 1,
        gridX: 0,
        gridY: 0,
      });
    }

    // Spatial Grid initialisieren
    const spatialGrid = new SpatialGrid(CONFIG.gridCellSize);

    // Verbindungen erstellen mit Spatial Partitioning
    const createConnections = () => {
      // Aktualisiere Grid
      spatialGrid.clear();
      particles.forEach((p, idx) => {
        spatialGrid.add(idx, p.x, p.y);
      });

      // Erstelle Verbindungen basierend auf Grid-Nachbarschaft
      particles.forEach((particle, index) => {
        const neighbors = spatialGrid.getNeighbors(particle.x, particle.y, 1);
        const availableIndices = neighbors.filter((i) => i !== index);

        if (availableIndices.length === 0) {
          // Fallback: Nimm alle anderen Neuronen
          const allIndices = particles
            .map((_, i) => i)
            .filter((i) => i !== index);
          const shuffled = allIndices.sort(() => Math.random() - 0.5);
          const numConnections = Math.floor(Math.random() * CONFIG.maxConnectionsPerNeuron) + 1;
          particle.connections = shuffled.slice(0, numConnections);
        } else {
          const shuffled = availableIndices.sort(() => Math.random() - 0.5);
          const numConnections = Math.min(
            Math.floor(Math.random() * CONFIG.maxConnectionsPerNeuron) + 1,
            availableIndices.length
          );
          particle.connections = shuffled.slice(0, numConnections);
        }
      });
    };

    createConnections();

    // Array für aktive Lichtsignale
    let signals: Signal[] = [];

    // Event-Queue-System mit activeSignalsCounter
    let activeSignalsCounter = 0;
    let originNeuronIndex: number | null = null;
    const neuronsThatReceivedSignal = new Set<number>();

    // Zeit-basiertes State-Management
    let lastSignalTime = 0;
    let nextSignalDelay = CONFIG.initialDelay;
    let isWaitingForSignals = false;

    // Delta Time für konstante Geschwindigkeit
    let lastTime = performance.now();

    // Resize Handler
    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
      ctx.restore();

      // Aktualisiere erweiterten Bereich
      paddingX = width * CONFIG.viewportPadding;
      paddingY = height * CONFIG.viewportPadding;
      minX = -paddingX;
      maxX = width + paddingX;
      minY = -paddingY;
      maxY = height + paddingY;
    };
    window.addEventListener("resize", handleResize);

    // Scroll Handler für virtuelle Koordinaten
    let scrollY = 0;
    const handleScroll = () => {
      scrollY = window.scrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Animation Loop mit Delta Time
    let animationFrameId: number;

    const render = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      ctx.clearRect(0, 0, width, height);

      // Aktualisiere Scroll-Position
      scrollY = window.scrollY;

      // Hilfsfunktion: Prüft ob Neuron im sichtbaren Bereich ist (mit Scroll-Offset)
      const isNeuronVisible = (p: Point): boolean => {
        const drawY = p.y - scrollY;
        return drawY >= -50 && drawY <= height + 50 && p.x >= -50 && p.x <= width + 50;
      };

      // Hilfsfunktion: Prüft ob Neuron im Viewport ist (für Signal-Trigger)
      const isNeuronInViewport = (p: Point): boolean => {
        const drawY = p.y - scrollY;
        return drawY >= 0 && drawY <= height && p.x >= 0 && p.x <= width;
      };

      // Signal-Trigger-Logik (zeit-basiert)
      if (activeSignalsCounter === 0 && !isWaitingForSignals) {
        if (currentTime - lastSignalTime >= nextSignalDelay) {
          // Starte neues Signal: Wähle zufälliges Neuron NUR innerhalb des Viewports
          const visibleNeurons = particles
            .map((p, idx) => ({ neuron: p, index: idx }))
            .filter(({ neuron }) => isNeuronInViewport(neuron));

          if (visibleNeurons.length > 0) {
            const randomVisible = visibleNeurons[Math.floor(Math.random() * visibleNeurons.length)];
            const firingNeuron = randomVisible.neuron;
            const firingIndex = randomVisible.index;
            firingNeuron.chargeTimer = CONFIG.originChargeDuration;
            firingNeuron.intensity = 1.0;
            neuronsThatReceivedSignal.clear();
            neuronsThatReceivedSignal.add(firingIndex);
            originNeuronIndex = firingIndex;
            activeSignalsCounter++;
            isWaitingForSignals = true;
            lastSignalTime = currentTime;
          }
        }
      }

      // Aktualisiere Spatial Grid regelmäßig (alle 500ms für Performance)
      // Das Grid wird hauptsächlich für Verbindungs-Erstellung genutzt
      // Für die Zeichnung nutzen wir Culling, daher ist häufige Aktualisierung nicht nötig
      if (Math.floor(currentTime / 500) !== Math.floor((currentTime - deltaTime) / 500)) {
        spatialGrid.clear();
        particles.forEach((p, idx) => {
          spatialGrid.add(idx, p.x, p.y);
        });
      }

      // Neuronen aktualisieren (zeit-basiert)
      particles.forEach((p, index) => {
        // Bewegung (zeit-basiert)
        p.x += (p.vx * deltaTime) / 1000;
        p.y += (p.vy * deltaTime) / 1000;

        // Bounce-Logik
        if (p.x < minX || p.x > maxX) p.vx *= -1;
        if (p.y < minY || p.y > maxY) p.vy *= -1;

        // Aufladung (zeit-basiert)
        if (p.chargeTimer > 0) {
          p.chargeTimer -= deltaTime;
          if (p.chargeTimer < 0) p.chargeTimer = 0;

          // Wenn Aufladung abgeschlossen ist, sende Signale
          if (p.chargeTimer === 0 && p.intensity > 0) {
            p.connections.forEach((connectedIndex) => {
              const target = particles[connectedIndex];
              if (!target) return;

              if (!p.connections.includes(connectedIndex)) return;

              if (neuronsThatReceivedSignal.has(connectedIndex)) return;

              const dx = target.x - p.x;
              const dy = target.y - p.y;
              const dist = Math.sqrt(dx * dx + dy * dy);

              const connectionKey = index < connectedIndex ? `${index}-${connectedIndex}` : `${connectedIndex}-${index}`;

              // Signalgeschwindigkeit in Pixel pro Millisekunde
              const signalSpeedPixelsPerMs = (CONFIG.signalSpeedCmPerSec * CONFIG.pixelsPerCm) / 1000;
              const signalDuration = dist / signalSpeedPixelsPerMs;

              // Erstelle Signal mit Partikel-Schweif
              const trail: Array<{ x: number; y: number; opacity: number }> = [];
              for (let i = 0; i < CONFIG.particleTrailCount; i++) {
                trail.push({
                  x: p.x,
                  y: p.y,
                  opacity: 0.8 - (i / CONFIG.particleTrailCount) * 0.6,
                });
              }

              signals.push({
                startX: p.x,
                startY: p.y,
                endX: target.x,
                endY: target.y,
                progress: 0,
                totalDistance: dist,
                connectionKey: connectionKey,
                intensity: p.intensity,
                targetIndex: connectedIndex,
                sourceIndex: index,
                speed: signalSpeedPixelsPerMs,
                trail: trail,
              });

              neuronsThatReceivedSignal.add(connectedIndex);
              activeSignalsCounter++;
            });

            p.intensity = 0;
          }
        }

        // Intensität langsam ausklingen lassen
        if (p.intensity > 0 && p.chargeTimer === 0) {
          p.intensity = Math.max(0, p.intensity - (deltaTime / 500)); // Ausklingen über 500ms
        }
      });

      // Verbindungen zeichnen (mit Bezier-Kurven)
      particles.forEach((p1, i) => {
        p1.connections.forEach((connectedIndex) => {
          if (connectedIndex > i) {
            const p2 = particles[connectedIndex];

            // Sichtbarkeits-Check: Nur zeichnen wenn beide Neuronen sichtbar sind
            const p1DrawY = p1.y - scrollY;
            const p2DrawY = p2.y - scrollY;
            if (
              (p1DrawY < -100 || p1DrawY > height + 100 || p1.x < -100 || p1.x > width + 100) &&
              (p2DrawY < -100 || p2DrawY > height + 100 || p2.x < -100 || p2.x > width + 100)
            ) {
              return; // Beide außerhalb, überspringe
            }

            const connectionKey = i < connectedIndex ? `${i}-${connectedIndex}` : `${connectedIndex}-${i}`;
            const activeSignal = signals.find((sig) => sig.connectionKey === connectionKey);

            // Berechne Kontrollpunkt für Bezier-Kurve (konsistent basierend auf connectionKey)
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const perpX = -dy;
            const perpY = dx;
            const perpLength = Math.sqrt(perpX * perpX + perpY * perpY);
            // Konsistenter Offset basierend auf connectionKey (Hash)
            const hash = connectionKey.split('-').reduce((acc, val) => acc + parseInt(val), 0);
            const offset = ((hash % 20) - 10) * 1.5; // -15 bis +15, konsistent
            const controlX = midX + (perpX / perpLength) * offset;
            const controlY = midY + (perpY / perpLength) * offset;

            // Zeichne Basis-Linie (Bezier-Kurve)
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y - scrollY);
            ctx.quadraticCurveTo(controlX, controlY - scrollY, p2.x, p2.y - scrollY);
            ctx.strokeStyle = CONFIG.colors.line;
            ctx.lineWidth = 0.5;
            ctx.stroke();

            // Wenn Signal aktiv ist, zeichne leuchtende Linie
            if (activeSignal) {
              const traveledDistance = activeSignal.progress * activeSignal.totalDistance;
              const fadeProgress = Math.min(traveledDistance / activeSignal.totalDistance, 1);
              const currentIntensity = activeSignal.intensity * (1 - fadeProgress * 0.3);

              const signalX = activeSignal.startX + (activeSignal.endX - activeSignal.startX) * activeSignal.progress;
              const signalY =
                activeSignal.startY + (activeSignal.endY - activeSignal.startY) * activeSignal.progress - scrollY;

              const startNeuron = i < connectedIndex ? p1 : p2;
              const signalGoesFromStart = activeSignal.sourceIndex === (i < connectedIndex ? i : connectedIndex);

              const lineStartX = signalGoesFromStart ? startNeuron.x : (i < connectedIndex ? p2.x : p1.x);
              const lineStartY = signalGoesFromStart
                ? startNeuron.y - scrollY
                : (i < connectedIndex ? p2.y - scrollY : p1.y - scrollY);

              // Berechne Kontrollpunkt für leuchtende Linie (konsistent mit Basis-Linie)
              const signalMidX = (lineStartX + signalX) / 2;
              const signalMidY = (lineStartY + signalY) / 2;
              const signalDx = signalX - lineStartX;
              const signalDy = signalY - lineStartY;
              const signalPerpX = -signalDy;
              const signalPerpY = signalDx;
              const signalPerpLength = Math.sqrt(signalPerpX * signalPerpX + signalPerpY * signalPerpY);
              const signalControlX = signalMidX + (signalPerpX / signalPerpLength) * (offset * 0.5);
              const signalControlY = signalMidY + (signalPerpY / signalPerpLength) * (offset * 0.5);

              const glowOpacity = currentIntensity * 0.4;
              const baseOpacity = 0.15;
              const finalOpacity = baseOpacity + glowOpacity * (1 - baseOpacity);

              // Glow-Effekt ohne shadowBlur (doppelte Linie)
              ctx.beginPath();
              ctx.moveTo(lineStartX, lineStartY);
              ctx.quadraticCurveTo(signalControlX, signalControlY, signalX, signalY);
              ctx.strokeStyle = `rgba(255, 255, 255, ${finalOpacity * 0.3})`;
              ctx.lineWidth = 4;
              ctx.stroke();

              // Heller Kern
              ctx.beginPath();
              ctx.moveTo(lineStartX, lineStartY);
              ctx.quadraticCurveTo(signalControlX, signalControlY, signalX, signalY);
              ctx.strokeStyle = `rgba(255, 255, 255, ${finalOpacity})`;
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          }
        });
      });

      // Neuronen zeichnen (mit Sichtbarkeits-Check)
      particles.forEach((p, index) => {
        const drawY = p.y - scrollY;

        // Culling: Überspringe Neuronen außerhalb des sichtbaren Bereichs
        if (drawY < -50 || drawY > height + 50 || p.x < -50 || p.x > width + 50) {
          return;
        }

        const isCharging = p.chargeTimer > 0;
        const isOriginNeuron = originNeuronIndex !== null && index === originNeuronIndex;
        const chargeDuration = isOriginNeuron ? CONFIG.originChargeDuration : CONFIG.chargeDuration;
        const chargeProgress = isCharging ? 1 - p.chargeTimer / chargeDuration : 0;

        const finalR = 255;
        const finalG = 255;
        const finalB = 255;
        const baseOpacity = isOriginNeuron && isCharging
          ? p.intensity * chargeProgress * 0.8
          : isCharging
            ? p.intensity * chargeProgress * 0.5
            : 0.3;
        const finalOpacity = baseOpacity;

        // Basis-Neuron
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, drawY, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${finalR}, ${finalG}, ${finalB}, ${finalOpacity})`;
        ctx.fill();
        ctx.restore();

        // Glow-Effekt wenn aufladend
        if (isCharging) {
          const glowRadius = isOriginNeuron ? 2 + chargeProgress * 8 : 2 + chargeProgress * 5;
          const glowOpacity = isOriginNeuron
            ? p.intensity * chargeProgress * 0.4
            : p.intensity * chargeProgress * 0.25;

          const gradient = ctx.createRadialGradient(p.x, drawY, 0, p.x, drawY, glowRadius);
          gradient.addColorStop(0, `rgba(255, 255, 255, ${glowOpacity})`);
          gradient.addColorStop(0.5, `rgba(255, 255, 255, ${glowOpacity * 0.5})`);
          gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);

          ctx.beginPath();
          ctx.arc(p.x, drawY, glowRadius, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
        }
      });

      // Signale aktualisieren und zeichnen (mit Partikel-Schweif)
      signals = signals.filter((sig) => {
        // Aktualisiere Progress (zeit-basiert)
        const progressDelta = (sig.speed * deltaTime) / sig.totalDistance;
        sig.progress += progressDelta;

        // Aktualisiere Partikel-Schweif
        const currentX = sig.startX + (sig.endX - sig.startX) * sig.progress;
        const currentY = sig.startY + (sig.endY - sig.startY) * sig.progress - scrollY;

        // Verschiebe Partikel im Schweif
        for (let i = sig.trail.length - 1; i > 0; i--) {
          const prevX = sig.startX + (sig.endX - sig.startX) * (sig.progress - progressDelta * (i + 1));
          const prevY = sig.startY + (sig.endY - sig.startY) * (sig.progress - progressDelta * (i + 1)) - scrollY;
          sig.trail[i].x = prevX;
          sig.trail[i].y = prevY;
        }
        sig.trail[0].x = currentX;
        sig.trail[0].y = currentY;

        const traveledDistance = sig.progress * sig.totalDistance;
        const fadeProgress = Math.min(traveledDistance / sig.totalDistance, 1);
        const currentIntensity = sig.intensity * (1 - fadeProgress * 0.3);
        const signalOpacity = currentIntensity * 0.6;

        // Zeichne Partikel-Schweif
        if (signalOpacity > 0.01) {
          sig.trail.forEach((particle, i) => {
            const particleOpacity = particle.opacity * signalOpacity * (1 - i / sig.trail.length);
            if (particleOpacity > 0.01) {
              ctx.save();
              ctx.beginPath();
              ctx.arc(particle.x, particle.y, 2 - (i / sig.trail.length) * 1.5, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(255, 255, 255, ${particleOpacity})`;
              ctx.fill();
              ctx.restore();
            }
          });
        }

        // Wenn Signal das Ziel erreicht hat
        if (sig.progress >= 1) {
          const targetNeuron = particles[sig.targetIndex];

          const finalIntensity = sig.intensity * (1 - CONFIG.signalDecayRate);

          if (targetNeuron.chargeTimer === 0 && finalIntensity > 0.01) {
            targetNeuron.chargeTimer = CONFIG.chargeDuration;
            targetNeuron.intensity = finalIntensity;
          }

          activeSignalsCounter--;
          return false;
        }

        return true;
      });

      // Prüfe ob alle Signale abgeklungen sind
      if (activeSignalsCounter === 0 && isWaitingForSignals) {
        // Warte bis alle Neuronen ihre Intensität verloren haben
        const allIntensitiesZero = particles.every((p) => Math.abs(p.intensity) < 0.001);
        if (allIntensitiesZero) {
          isWaitingForSignals = false;
          originNeuronIndex = null;
          neuronsThatReceivedSignal.clear();
          nextSignalDelay = CONFIG.pauseBetweenSignals;
          lastSignalTime = currentTime;
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render(performance.now());

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 -z-[1] pointer-events-none bg-background transition-colors duration-500"
      style={{ height: '100vh' }}
      aria-hidden="true"
    >
      <canvas 
        ref={canvasRef} 
        className="absolute top-0 left-0 w-full opacity-60 dark:opacity-80"
        style={{
          filter: 'blur(0.5px) brightness(1.2)', // Bloom-Effekt via CSS
        }}
      />
    </div>
  );
}
