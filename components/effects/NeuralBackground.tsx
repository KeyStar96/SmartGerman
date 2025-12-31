"use client";

import { useEffect, useRef } from "react";

// Konfiguration passend zu Ihrem globals.css
const CONFIG = {
  particleCount: 65, // Anzahl der Neuronen (leicht erhöht)
  baseSpeed: 0.3, // Bewegungsgeschwindigkeit der Neuronen
  signalSpeedCmPerSec: 5, // Signalgeschwindigkeit in cm/s
  pixelsPerCm: 37.8, // Pixel pro cm (bei 96 DPI)
  fps: 60, // Frames pro Sekunde
  signalFrequency: 0.004, // Wahrscheinlichkeit eines Signals pro Frame (weiter reduziert)
  chargeDuration: 60, // Frames für 1 Sekunde Aufladung (bei 60fps)
  maxConnectionsPerNeuron: 5, // Maximale Anzahl der Verbindungen pro Neuron
  viewportPadding: 0.2, // 20% Padding außerhalb des sichtbaren Bereichs
  signalDecayRate: 0.15, // Leuchtkraft-Verlust pro Verbindung (15% pro Hop)
  beamLength: 30, // Länge des Lichtstrahls in Pixeln
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
  chargeTimer: number; // Timer für das Aufladen (0 = nicht aktiv, max = CONFIG.chargeDuration)
  intensity: number; // Leuchtkraft des Neurons (0.0 bis 1.0)
  connections: number[]; // Indizes der verbundenen Neuronen
  colorValue: number; // Wert zwischen 0 (Cyan) und 1 (Orange) für Farbvariation
}

interface Signal {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  progress: number; // 0.0 bis 1.0
  totalDistance: number; // Gesamtdistanz in Pixeln
  connectionKey: string; // Eindeutiger Key für die Verbindung (z.B. "0-5")
  intensity: number; // Leuchtkraft des Signals (0.0 bis 1.0)
  targetIndex: number; // Index des Ziel-Neurons
  progressPerFrame: number; // Berechnete Progress-Erhöhung pro Frame (basierend auf 5cm/s)
}

export default function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Berechne erweiterten Bereich für Neuronen (außerhalb des sichtbaren Bereichs)
    const paddingX = width * CONFIG.viewportPadding;
    const paddingY = height * CONFIG.viewportPadding;
    const minX = -paddingX;
    const maxX = width + paddingX;
    const minY = -paddingY;
    const maxY = height + paddingY;

    // 1. Neuronen initialisieren (auch außerhalb des sichtbaren Bereichs)
    const particles: Point[] = [];
    for (let i = 0; i < CONFIG.particleCount; i++) {
      particles.push({
        x: minX + Math.random() * (maxX - minX),
        y: minY + Math.random() * (maxY - minY),
        vx: (Math.random() - 0.5) * CONFIG.baseSpeed,
        vy: (Math.random() - 0.5) * CONFIG.baseSpeed,
        chargeTimer: 0, // Startet ohne Aufladung
        intensity: 0, // Startet ohne Leuchtkraft
        connections: [], // Wird nach Initialisierung gefüllt
        colorValue: 1, // Immer weiß (1 = weiß)
      });
    }

    // 2. Verbindungen erstellen: Jedes Neuron bekommt 1-5 zufällige Verbindungen
    particles.forEach((particle, index) => {
      const availableIndices = particles
        .map((_, i) => i)
        .filter((i) => i !== index);
      
      // Mische die verfügbaren Indizes zufällig
      const shuffled = availableIndices.sort(() => Math.random() - 0.5);
      
      // Zufällige Anzahl zwischen 1 und maxConnectionsPerNeuron
      const numConnections = Math.floor(Math.random() * CONFIG.maxConnectionsPerNeuron) + 1;
      
      // Wähle die ersten numConnections aus
      particle.connections = shuffled.slice(0, numConnections);
    });

    // Array für aktive Lichtsignale
    let signals: Signal[] = [];
    
    // Map für leuchtende Verbindungen: Key ist "index1-index2" (immer kleinerer Index zuerst)
    // Wert ist die aktuelle Leuchtkraft (0.0 bis 1.0)
    const connectionGlowIntensities: Map<string, number> = new Map();
    
    // Frame-Counter für seltene Signal-Generierung
    let frameCount = 0;

    // Resize Handler
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      // Aktualisiere auch den erweiterten Bereich
      const newPaddingX = width * CONFIG.viewportPadding;
      const newPaddingY = height * CONFIG.viewportPadding;
      // Neuronen können weiterhin außerhalb existieren, keine Neuinitialisierung nötig
    };
    window.addEventListener("resize", handleResize);

    // Animation Loop
    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      frameCount++;

      // A. Neuronen bewegen und Signal-Logik verarbeiten
      particles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;

        // Erweiterte Bounce-Logik: Neuronen können außerhalb des sichtbaren Bereichs existieren
        // Bounce nur an den erweiterten Rändern
        const paddingX = width * CONFIG.viewportPadding;
        const paddingY = height * CONFIG.viewportPadding;
        if (p.x < -paddingX || p.x > width + paddingX) p.vx *= -1;
        if (p.y < -paddingY || p.y > height + paddingY) p.vy *= -1;

        // Wenn Neuron auflädt, Timer reduzieren
        if (p.chargeTimer > 0) {
          p.chargeTimer--;
          
          // Wenn Aufladung abgeschlossen ist, sende Signale
          if (p.chargeTimer === 0 && p.intensity > 0) {
            // Sende Signale an alle verbundenen Neuronen
            p.connections.forEach((connectedIndex) => {
              const target = particles[connectedIndex];
              const dx = target.x - p.x;
              const dy = target.y - p.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              
              // Eindeutiger Key für diese Verbindung (immer kleinerer Index zuerst)
              const connectionKey = index < connectedIndex 
                ? `${index}-${connectedIndex}` 
                : `${connectedIndex}-${index}`;
              
              // Berechne reduzierte Leuchtkraft (Signal verliert auf dem Weg)
              const signalIntensity = p.intensity * (1 - CONFIG.signalDecayRate);
              
              // Setze Glow-Intensität für diese Verbindung
              connectionGlowIntensities.set(connectionKey, signalIntensity);
              
              // Berechne Signalgeschwindigkeit: 5 cm/s = 189 Pixel/s bei 60fps = 3.15 Pixel/Frame
              // Progress pro Frame = (Signalgeschwindigkeit in Pixel/Frame) / Gesamtdistanz
              const signalSpeedPixelsPerFrame = (CONFIG.signalSpeedCmPerSec * CONFIG.pixelsPerCm) / CONFIG.fps;
              const progressPerFrame = signalSpeedPixelsPerFrame / dist;
              
              // Erstelle Signal
              signals.push({
                startX: p.x,
                startY: p.y,
                endX: target.x,
                endY: target.y,
                progress: 0,
                totalDistance: dist,
                connectionKey: connectionKey,
                intensity: signalIntensity,
                targetIndex: connectedIndex,
                progressPerFrame: progressPerFrame,
              });
            });
            
            // Neuron hat Signal gesendet, Leuchtkraft zurücksetzen
            p.intensity = 0;
          }
        }
      });

      // B. Verbindungen zeichnen (nur die definierten Verbindungen pro Neuron)
      particles.forEach((p1, i) => {
        p1.connections.forEach((connectedIndex) => {
          // Zeichne nur einmal pro Verbindung (vermeide Duplikate)
          if (connectedIndex > i) {
            const p2 = particles[connectedIndex];
            
            // Eindeutiger Key für diese Verbindung
            const connectionKey = `${i}-${connectedIndex}`;
            
            // Prüfe ob diese Verbindung gerade aufleuchtet
            const glowIntensity = connectionGlowIntensities.get(connectionKey) || 0;
            
            // Basis-Linienfarbe (dezent)
            const baseOpacity = 0.15;
            // Wenn die Linie aufleuchtet, wird sie heller (weiß-orange) - dezenter
            const glowOpacity = glowIntensity * 0.4; // Maximal 0.4 Opazität beim Aufleuchten (reduziert)
            
            // Interpoliere zwischen Basis-Farbe und Weiß-Glow
            const finalOpacity = baseOpacity + glowOpacity * (1 - baseOpacity);
            const finalColor = glowIntensity > 0 
              ? `rgba(255, 255, 255, ${finalOpacity})` // Weiß wenn aufleuchtend
              : CONFIG.colors.line; // Normale Farbe wenn nicht
            
            // Linienbreite erhöht sich beim Aufleuchten
            const lineWidth = 0.5 + glowIntensity * 1.5;
            
            // Verbindungslinie zeichnen
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = finalColor;
            ctx.lineWidth = lineWidth;
            ctx.stroke();
          }
        });
      });
      
      // Glow-Intensität für Verbindungen reduzieren (langsames Abdunkeln)
      connectionGlowIntensities.forEach((intensity, key) => {
        if (intensity > 0.01) {
          connectionGlowIntensities.set(key, intensity * 0.95); // Langsames Abdunkeln
        } else {
          connectionGlowIntensities.delete(key);
        }
      });

      // C. Zufälliges Feuern eines Neurons (nur wenn nicht bereits aktiv)
      if (Math.random() < CONFIG.signalFrequency) {
        // Wähle ein zufälliges Neuron, das nicht bereits auflädt
        const availableNeurons = particles.filter(p => p.chargeTimer === 0);
        if (availableNeurons.length > 0) {
          const firingNeuron = availableNeurons[Math.floor(Math.random() * availableNeurons.length)];
          
          // Neuron beginnt aufzuladen (1 Sekunde = 60 Frames)
          firingNeuron.chargeTimer = CONFIG.chargeDuration;
          firingNeuron.intensity = 1.0; // Volle Leuchtkraft
        }
      }

      // D. Neuronen zeichnen (mit Glow-Effekt wenn aktiv)
      // Nur Neuronen zeichnen, die im sichtbaren Bereich oder nahe dran sind
      particles.forEach((p) => {
        // Zeichne Neuron auch wenn es leicht außerhalb ist (für sanfte Übergänge)
        const paddingX = width * 0.1;
        const paddingY = height * 0.1;
        if (p.x < -paddingX || p.x > width + paddingX || 
            p.y < -paddingY || p.y > height + paddingY) {
          return; // Überspringe Neuronen, die zu weit außerhalb sind
        }

        const isCharging = p.chargeTimer > 0;
        const chargeProgress = isCharging ? 1 - (p.chargeTimer / CONFIG.chargeDuration) : 0;
        
        // Alle Neuronen sind initial weiß
        const finalR = 255;
        const finalG = 255;
        const finalB = 255;
        // Dezente Opazität: beim Aufladen etwas heller, sonst sehr dezent
        const finalOpacity = isCharging 
          ? p.intensity * chargeProgress * 0.5 // Maximal 0.5 beim Aufladen (dezenter)
          : 0.3; // Sehr dezente Basis-Opazität (reduziert von 0.6)

        // Basis-Neuron
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${finalR}, ${finalG}, ${finalB}, ${finalOpacity})`;
        ctx.fill();

        // Weicher Glow-Effekt wenn aufladend (weiß, mit weichem Übergang) - dezenter
        if (isCharging) {
          // Mehrere konzentrische Kreise für weichen Übergang
          const glowRadius = 2 + chargeProgress * 5; // Radius wächst von 2 bis 7 (etwas kleiner)
          const glowOpacity = p.intensity * chargeProgress * 0.25; // Dezenter (reduziert von 0.4)
          
          // Äußerer Glow (größer, transparenter)
          const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowRadius);
          gradient.addColorStop(0, `rgba(255, 255, 255, ${glowOpacity})`);
          gradient.addColorStop(0.5, `rgba(255, 255, 255, ${glowOpacity * 0.5})`);
          gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
          
          ctx.beginPath();
          ctx.arc(p.x, p.y, glowRadius, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
        }
      });

      // E. Signale aktualisieren und zeichnen (als Lichtstrahl)
      signals = signals.filter((sig) => {
        // Verwende die berechnete Progress-Erhöhung basierend auf 5cm/s
        sig.progress += sig.progressPerFrame;

        // Aktuelle Position des Signal-Starts (Mitte des Strahls)
        const currentX = sig.startX + (sig.endX - sig.startX) * sig.progress;
        const currentY = sig.startY + (sig.endY - sig.startY) * sig.progress;

        // Berechne Richtungsvektor der Verbindung
        const dx = sig.endX - sig.startX;
        const dy = sig.endY - sig.startY;
        const angle = Math.atan2(dy, dx);

        // Berechne zurückgelegte Distanz
        const traveledDistance = sig.progress * sig.totalDistance;
        
        // Opazität nimmt mit der Distanz ab (Fade-out basierend auf Signal-Intensität) - dezenter
        const maxFadeDistance = sig.totalDistance;
        const fadeProgress = Math.min(traveledDistance / maxFadeDistance, 1);
        const signalOpacity = sig.intensity * (1 - fadeProgress) * 0.6; // Etwas heller für bessere Sichtbarkeit

        // Signal nur zeichnen wenn noch sichtbar
        if (signalOpacity > 0.01) {
          // Zeichne Lichtstrahl entlang der Verbindungslinie
          const beamHalfLength = CONFIG.beamLength / 2;
          
          // Start- und Endpunkt des Strahls (entlang der Verbindungslinie)
          const beamStartX = currentX - Math.cos(angle) * beamHalfLength;
          const beamStartY = currentY - Math.sin(angle) * beamHalfLength;
          const beamEndX = currentX + Math.cos(angle) * beamHalfLength;
          const beamEndY = currentY + Math.sin(angle) * beamHalfLength;
          
          // Erstelle Gradient für weichen Übergang (heller in der Mitte, transparenter an den Rändern)
          const gradient = ctx.createLinearGradient(beamStartX, beamStartY, beamEndX, beamEndY);
          gradient.addColorStop(0, `rgba(255, 255, 255, 0)`);
          gradient.addColorStop(0.3, `rgba(255, 255, 255, ${signalOpacity * 0.6})`);
          gradient.addColorStop(0.5, `rgba(255, 255, 255, ${signalOpacity})`);
          gradient.addColorStop(0.7, `rgba(255, 255, 255, ${signalOpacity * 0.6})`);
          gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
          
          // Zeichne den Lichtstrahl
          ctx.beginPath();
          ctx.moveTo(beamStartX, beamStartY);
          ctx.lineTo(beamEndX, beamEndY);
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 2.5; // Etwas dicker für bessere Sichtbarkeit
          ctx.lineCap = 'round';
          ctx.stroke();
          
          // Zusätzlich: Zeichne einen hellen Kern in der Mitte
          ctx.beginPath();
          ctx.arc(currentX, currentY, 2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${signalOpacity * 0.8})`;
          ctx.fill();
        }

        // Wenn Signal das Ziel erreicht hat
        if (sig.progress >= 1) {
          const targetNeuron = particles[sig.targetIndex];
          
          // Nur aktivieren wenn Ziel-Neuron nicht bereits aktiv ist
          if (targetNeuron.chargeTimer === 0) {
            // Ziel-Neuron beginnt aufzuladen mit der verbleibenden Leuchtkraft
            targetNeuron.chargeTimer = CONFIG.chargeDuration;
            targetNeuron.intensity = sig.intensity; // Verwendet die reduzierte Leuchtkraft
          }
          
          return false; // Entferne Signal
        }

        return true;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 -z-[1] pointer-events-none overflow-hidden bg-background transition-colors duration-500"
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-60 dark:opacity-80" />
    </div>
  );
}