"use client";

import { useEffect, useRef } from "react";

// Konfiguration passend zu Ihrem globals.css
const CONFIG = {
  particleCount: 65, // Anzahl der Neuronen (leicht erhöht)
  baseSpeed: 0.3, // Bewegungsgeschwindigkeit der Neuronen
  signalSpeedCmPerSec: 8, // Signalgeschwindigkeit in cm/s
  pixelsPerCm: 37.8, // Pixel pro cm (bei 96 DPI)
  fps: 60, // Frames pro Sekunde
  initialDelay: 300, // 5 Sekunden Startverzögerung (300 Frames bei 60fps)
  pauseBetweenSignals: 300, // 5 Sekunden Pause zwischen Signalen
  chargeDuration: 60, // Frames für 1 Sekunde Aufladung (bei 60fps)
  originChargeDuration: 90, // Frames für 1.5 Sekunden Aufladung für Ursprungsneuron
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
  intensity: number; // Leuchtkraft des Signals (0.0 bis 1.0) - wird auf der Strecke reduziert
  targetIndex: number; // Index des Ziel-Neurons
  sourceIndex: number; // Index des Quell-Neurons (um Rückwärts-Signale zu vermeiden)
  progressPerFrame: number; // Berechnete Progress-Erhöhung pro Frame (basierend auf 5cm/s)
}

export default function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Stelle sicher, dass Canvas die richtige Größe hat (für runde Neuronen)
    // Verwende die gesamte Dokument-Höhe für Scroll-Unterstützung
    const dpr = window.devicePixelRatio || 1;
    let width = window.innerWidth;
    let height = Math.max(window.innerHeight, document.documentElement.scrollHeight);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

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
    
    // State-Management für Signal-System
    type SignalState = 'initial_delay' | 'charging' | 'signaling' | 'waiting';
    let signalState: SignalState = 'initial_delay';
    let stateTimer = CONFIG.initialDelay; // Startet mit 5 Sekunden Verzögerung
    
    // Set der Neuronen, die bereits Signale empfangen haben (um Rückwärts-Signale zu vermeiden)
    const neuronsThatReceivedSignal = new Set<number>();
    
    // Index des ursprünglichen Neurons (für verstärktes Aufleuchten)
    let originNeuronIndex: number | null = null;
    
    // Frame-Counter
    let frameCount = 0;

    // Resize Handler
    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      // Verwende die gesamte Dokument-Höhe für Scroll-Unterstützung
      height = Math.max(window.innerHeight, document.documentElement.scrollHeight);
      // Speichere aktuelle Transformation
      ctx.save();
      // Setze Transformation zurück
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      // Skaliere wieder
      ctx.scale(dpr, dpr);
      ctx.restore();
      // Aktualisiere auch den erweiterten Bereich
      const newPaddingX = width * CONFIG.viewportPadding;
      const newPaddingY = height * CONFIG.viewportPadding;
      // Neuronen können weiterhin außerhalb existieren, keine Neuinitialisierung nötig
    };
    window.addEventListener("resize", handleResize);

    // Animation Loop
    let animationFrameId: number;

    const render = () => {
      // Aktualisiere Höhe basierend auf Dokument-Höhe (für Scroll-Unterstützung)
      const currentDocHeight = Math.max(window.innerHeight, document.documentElement.scrollHeight);
      if (currentDocHeight !== height) {
        height = currentDocHeight;
        const dpr = window.devicePixelRatio || 1;
        // Speichere aktuelle Transformation
        ctx.save();
        // Setze Transformation zurück
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        canvas.height = height * dpr;
        canvas.style.height = `${height}px`;
        // Skaliere wieder
        ctx.scale(dpr, dpr);
        ctx.restore();
      }
      
      ctx.clearRect(0, 0, width, height);
      frameCount++;

      // Hilfsfunktion: Prüft ob Neuron innerhalb des sichtbaren Bereichs ist
      const isNeuronInViewport = (p: Point): boolean => {
        return p.x >= 0 && p.x <= width && p.y >= 0 && p.y <= height;
      };

      // A. State-Management für Signal-System
      if (signalState === 'initial_delay') {
        stateTimer--;
        if (stateTimer <= 0) {
          // Starte neues Signal: Wähle zufälliges Neuron NUR innerhalb des sichtbaren Bereichs
          const visibleNeurons = particles
            .map((p, idx) => ({ neuron: p, index: idx }))
            .filter(({ neuron }) => isNeuronInViewport(neuron));
          
          if (visibleNeurons.length > 0) {
            const randomVisible = visibleNeurons[Math.floor(Math.random() * visibleNeurons.length)];
            const firingNeuron = randomVisible.neuron;
            const firingIndex = randomVisible.index;
            firingNeuron.chargeTimer = CONFIG.originChargeDuration; // Längere Aufladung für Ursprungsneuron
            firingNeuron.intensity = 1.0;
            neuronsThatReceivedSignal.clear();
            neuronsThatReceivedSignal.add(firingIndex);
            originNeuronIndex = firingIndex; // Merke ursprüngliches Neuron
            signalState = 'charging';
          }
        }
      } else if (signalState === 'charging') {
        // Prüfe ob das erste Neuron fertig aufgeladen hat und Signale gesendet wurden
        // Wechsle zu 'signaling' sobald Signale existieren
        if (signals.length > 0) {
          signalState = 'signaling';
        } else {
          // Prüfe ob alle Neuronen fertig aufgeladen haben (falls keine Signale gesendet wurden)
          const allCharged = particles.every(p => p.chargeTimer === 0 || p.intensity === 0);
          if (allCharged) {
            signalState = 'signaling';
          }
        }
      } else if (signalState === 'signaling') {
        // Prüfe ob ALLES abgeklungen ist: keine Signale, keine aufladenden Neuronen, keine Intensitäten
        // WICHTIG: Warte bis wirklich ALLES fertig ist, bevor ein neues Signal gestartet wird
        // Zusätzlich: Prüfe ob alle Neuronen ihre Intensität auf 0 haben UND keine Signale mehr unterwegs sind
        const noActiveSignals = signals.length === 0;
        const noChargingNeurons = particles.every(p => p.chargeTimer === 0);
        const noIntensities = particles.every(p => Math.abs(p.intensity) < 0.001); // Verwende Epsilon für Float-Vergleich
        
        // Zusätzliche Sicherheitsprüfung: Warte eine Frame länger, um sicherzustellen, dass wirklich alles abgeklungen ist
        const allSignalsDone = noActiveSignals && noChargingNeurons && noIntensities;
        if (allSignalsDone) {
          originNeuronIndex = null; // Reset für nächstes Signal
          neuronsThatReceivedSignal.clear(); // Reset für nächstes Signal
          signalState = 'waiting';
          stateTimer = CONFIG.pauseBetweenSignals;
        }
      } else if (signalState === 'waiting') {
        stateTimer--;
        if (stateTimer <= 0) {
          // Starte neues Signal: Wähle zufälliges Neuron NUR innerhalb des sichtbaren Bereichs
          const visibleNeurons = particles
            .map((p, idx) => ({ neuron: p, index: idx }))
            .filter(({ neuron }) => isNeuronInViewport(neuron));
          
          if (visibleNeurons.length > 0) {
            const randomVisible = visibleNeurons[Math.floor(Math.random() * visibleNeurons.length)];
            const firingNeuron = randomVisible.neuron;
            const firingIndex = randomVisible.index;
            firingNeuron.chargeTimer = CONFIG.originChargeDuration; // Längere Aufladung für Ursprungsneuron
            firingNeuron.intensity = 1.0;
            neuronsThatReceivedSignal.clear();
            neuronsThatReceivedSignal.add(firingIndex);
            originNeuronIndex = firingIndex; // Merke ursprüngliches Neuron
            signalState = 'charging';
          }
        }
      }

      // B. Neuronen bewegen und Signal-Logik verarbeiten
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
          
          // Wenn Aufladung abgeschlossen ist, sende Signale (im charging oder signaling State)
          if (p.chargeTimer === 0 && p.intensity > 0 && (signalState === 'charging' || signalState === 'signaling')) {
            // Sende Signale an alle verbundenen Neuronen (außer die, die bereits Signale empfangen haben)
            p.connections.forEach((connectedIndex) => {
              // WICHTIG: Prüfe ob die Verbindung wirklich existiert
              // Eine Verbindung existiert nur, wenn beide Neuronen sich gegenseitig verbunden haben
              // ODER wenn das Quell-Neuron das Ziel-Neuron in seiner connections-Liste hat
              const target = particles[connectedIndex];
              if (!target) {
                return; // Sicherheitsprüfung
              }
              
              // Prüfe ob die Verbindung wirklich existiert (Quell-Neuron muss Ziel-Neuron in connections haben)
              if (!p.connections.includes(connectedIndex)) {
                return; // Verbindung existiert nicht
              }
              
              // Überspringe Neuronen, die bereits Signale empfangen haben (verhindert Rückwärts-Signale)
              if (neuronsThatReceivedSignal.has(connectedIndex)) {
                return;
              }
              const dx = target.x - p.x;
              const dy = target.y - p.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              
            // Eindeutiger Key für diese Verbindung (immer kleinerer Index zuerst)
            // WICHTIG: Muss konsistent sein mit der Zeichnung der Verbindungen
            const connectionKey = index < connectedIndex 
              ? `${index}-${connectedIndex}` 
              : `${connectedIndex}-${index}`;
              
              // Berechne Signalgeschwindigkeit: 5 cm/s = 189 Pixel/s bei 60fps = 3.15 Pixel/Frame
              // Progress pro Frame = (Signalgeschwindigkeit in Pixel/Frame) / Gesamtdistanz
              const signalSpeedPixelsPerFrame = (CONFIG.signalSpeedCmPerSec * CONFIG.pixelsPerCm) / CONFIG.fps;
              const progressPerFrame = signalSpeedPixelsPerFrame / dist;
              
              // Erstelle Signal mit voller Intensität (wird auf der Strecke reduziert)
              signals.push({
                startX: p.x,
                startY: p.y,
                endX: target.x,
                endY: target.y,
                progress: 0,
                totalDistance: dist,
                connectionKey: connectionKey,
                intensity: p.intensity, // Startet mit voller Intensität
                targetIndex: connectedIndex,
                sourceIndex: index,
                progressPerFrame: progressPerFrame,
              });
              
              // Markiere Ziel-Neuron als Empfänger
              neuronsThatReceivedSignal.add(connectedIndex);
            });
            
            // Neuron hat Signal gesendet, Leuchtkraft zurücksetzen
            p.intensity = 0;
          }
        }
      });

      // C. Verbindungen zeichnen (nur die definierten Verbindungen pro Neuron)
      particles.forEach((p1, i) => {
        p1.connections.forEach((connectedIndex) => {
          // Zeichne nur einmal pro Verbindung (vermeide Duplikate)
          if (connectedIndex > i) {
            const p2 = particles[connectedIndex];
            
            // Eindeutiger Key für diese Verbindung (MUSS konsistent sein mit Signal-Erstellung)
            // WICHTIG: Verwende immer die gleiche Reihenfolge (kleinerer Index zuerst)
            const connectionKey = i < connectedIndex 
              ? `${i}-${connectedIndex}` 
              : `${connectedIndex}-${i}`;
            
            // Finde aktives Signal auf dieser Verbindung
            const activeSignal = signals.find(sig => sig.connectionKey === connectionKey);
            
            // Zeichne zuerst die Basis-Linie (ganze Strecke, dezent)
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = CONFIG.colors.line;
          ctx.lineWidth = 0.5;
          ctx.stroke();
            
            // Wenn Signal aktiv ist, zeichne leuchtende Linie HINTER dem Signal
            if (activeSignal) {
              // Berechne aktuelle Signal-Intensität (wird auf der Strecke reduziert)
              const traveledDistance = activeSignal.progress * activeSignal.totalDistance;
              const fadeProgress = Math.min(traveledDistance / activeSignal.totalDistance, 1);
              const currentIntensity = activeSignal.intensity * (1 - fadeProgress);
              
              // Berechne Signal-Position
              const signalX = activeSignal.startX + (activeSignal.endX - activeSignal.startX) * activeSignal.progress;
              const signalY = activeSignal.startY + (activeSignal.endY - activeSignal.startY) * activeSignal.progress;
              
              // Bestimme Start- und Endpunkt der Verbindung (konsistent mit connectionKey)
              // connectionKey ist immer "kleinererIndex-größererIndex"
              const startNeuron = i < connectedIndex ? p1 : p2;
              const endNeuron = i < connectedIndex ? p2 : p1;
              
              // Prüfe ob Signal von startNeuron zu endNeuron geht
              const signalGoesFromStart = activeSignal.sourceIndex === (i < connectedIndex ? i : connectedIndex);
              
              // Linie leuchtet nur HINTER dem Signal (von Start bis Signal-Position)
              const glowOpacity = currentIntensity * 0.4;
              const baseOpacity = 0.15;
              const finalOpacity = baseOpacity + glowOpacity * (1 - baseOpacity);
              
              // Zeichne leuchtende Linie nur bis zur Signal-Position
              // WICHTIG: Startpunkt muss der Quell-Neuron sein
              const lineStartX = signalGoesFromStart ? startNeuron.x : endNeuron.x;
              const lineStartY = signalGoesFromStart ? startNeuron.y : endNeuron.y;
              
              // Dezenter Glow-Effekt um die Linie (abstrahlt in die Umgebung)
              // Zeichne zuerst den Glow (größer, transparenter)
              ctx.save();
              ctx.shadowBlur = 8 + currentIntensity * 12; // Blur-Radius von 8 bis 20
              ctx.shadowColor = `rgba(255, 255, 255, ${currentIntensity * 0.15})`; // Sehr dezenter weißer Glow
              ctx.beginPath();
              ctx.moveTo(lineStartX, lineStartY);
              ctx.lineTo(signalX, signalY);
              ctx.strokeStyle = `rgba(255, 255, 255, ${finalOpacity * 0.3})`; // Transparenter für Glow
              ctx.lineWidth = 0.5 + currentIntensity * 1.5;
              ctx.stroke();
              ctx.restore();
              
              // Zeichne die eigentliche leuchtende Linie (ohne Shadow)
              ctx.beginPath();
              ctx.moveTo(lineStartX, lineStartY);
              ctx.lineTo(signalX, signalY);
              ctx.strokeStyle = `rgba(255, 255, 255, ${finalOpacity})`;
              ctx.lineWidth = 0.5 + currentIntensity * 1.5;
              ctx.stroke();
            }
          }
        });
      });


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
        const isOriginNeuron = originNeuronIndex !== null && particles.indexOf(p) === originNeuronIndex;
        const chargeDuration = isOriginNeuron ? CONFIG.originChargeDuration : CONFIG.chargeDuration;
        const chargeProgress = isCharging ? 1 - (p.chargeTimer / chargeDuration) : 0;
        
        // Alle Neuronen sind initial weiß
        const finalR = 255;
        const finalG = 255;
        const finalB = 255;
        // Ursprungsneuron: Deutlicher und länger aufleuchten
        const baseOpacity = isOriginNeuron && isCharging 
          ? p.intensity * chargeProgress * 0.8 // Maximal 0.8 für Ursprungsneuron (deutlicher)
          : isCharging 
            ? p.intensity * chargeProgress * 0.5 // Maximal 0.5 beim Aufladen (dezenter)
            : 0.3; // Sehr dezente Basis-Opazität
        const finalOpacity = baseOpacity;

        // Basis-Neuron (perfekter Kreis)
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${finalR}, ${finalG}, ${finalB}, ${finalOpacity})`;
        ctx.fill();
        ctx.restore();

        // Weicher Glow-Effekt wenn aufladend (weiß, mit weichem Übergang)
        if (isCharging) {
          // Ursprungsneuron: Größerer und hellerer Glow
          const glowRadius = isOriginNeuron 
            ? 2 + chargeProgress * 8 // Radius wächst von 2 bis 10 für Ursprungsneuron
            : 2 + chargeProgress * 5; // Radius wächst von 2 bis 7 für normale Neuronen
          const glowOpacity = isOriginNeuron
            ? p.intensity * chargeProgress * 0.4 // Heller für Ursprungsneuron
            : p.intensity * chargeProgress * 0.25; // Dezenter für normale Neuronen
          
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

      // D. Signale aktualisieren und zeichnen (als Lichtstrahl)
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
        
        // Signal wird auf der Strecke dunkler (Intensität nimmt mit der Distanz ab)
        const fadeProgress = Math.min(traveledDistance / sig.totalDistance, 1);
        const currentIntensity = sig.intensity * (1 - fadeProgress);
        const signalOpacity = currentIntensity * 0.6;

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
          ctx.lineWidth = 2.5;
          ctx.lineCap = 'round';
          ctx.stroke();
          
          // Zusätzlich: Zeichne einen hellen Kern in der Mitte (perfekter Kreis)
          ctx.save();
          ctx.beginPath();
          ctx.arc(currentX, currentY, 2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${signalOpacity * 0.8})`;
          ctx.fill();
          ctx.restore();
        }

        // Wenn Signal das Ziel erreicht hat
        if (sig.progress >= 1) {
          const targetNeuron = particles[sig.targetIndex];
          
          // Berechne finale Intensität: Signal verliert beim Empfang signalDecayRate
          // (Die visuelle Reduktion auf der Strecke ist nur für die Darstellung)
          const finalIntensity = sig.intensity * (1 - CONFIG.signalDecayRate);
          
          // Nur aktivieren wenn Ziel-Neuron nicht bereits aktiv ist und wir im Signaling-State sind
          if (targetNeuron.chargeTimer === 0 && signalState === 'signaling') {
            // Ziel-Neuron beginnt aufzuladen mit der reduzierten Leuchtkraft
            targetNeuron.chargeTimer = CONFIG.chargeDuration;
            targetNeuron.intensity = finalIntensity;
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
      className="fixed inset-0 -z-[1] pointer-events-none bg-background transition-colors duration-500"
      style={{ height: '100vh' }}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full opacity-60 dark:opacity-80" />
    </div>
  );
}