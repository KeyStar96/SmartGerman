"use client";

import { useEffect, useRef } from "react";

/**
 * KONFIGURATION
 * Feintuning für das "Awwwards"-Look & Feel
 */
const CONFIG = {
  // Gitter & Dichte
  neuronDensity: 0.00008,     // Dichte der Punkte
  connectionDistance: 160,    // Maximale Verbindungsdistanz
  
  // Physik (Maus-Interaktion)
  mouseInteractionRadius: 250, // Radius, in dem die Maus wirkt
  mouseForce: 0.08,           // Stärke der Anziehung (0.01 - 0.1)
  springStiffness: 0.04,      // Wie stark will der Punkt zurück zum Ursprung?
  damping: 0.92,              // Reibung (0.9 = gleitend, 0.5 = zäh)
  
  // Signale (Impulse)
  signalSpeed: 2.5,           // Pixel pro Frame
  signalLength: 30,           // Länge des Schweifs
  signalColor: "255, 92, 0",  // Deine Primary Orange (#FF5C00) in RGB
  
  // Optik
  baseColor: "255, 255, 255", // Basis-Farbe (wird im Darkmode via Opacity geregelt)
  baseOpacity: 0.15,          // Opazität der ruhenden Linien
  particleSize: 1.8,          // Größe der Neuronen
};

interface Neuron {
  x: number;      // Aktuelle X-Position
  y: number;      // Aktuelle Y-Position
  baseX: number;  // Ursprungs-X (Ruheposition)
  baseY: number;  // Ursprungs-Y (Ruheposition)
  vx: number;     // Geschwindigkeit X
  vy: number;     // Geschwindigkeit Y
  connections: number[]; // Indizes der verbundenen Neuronen
}

interface Pulse {
  fromIndex: number; // Start-Neuron Index
  toIndex: number;   // Ziel-Neuron Index
  progress: number;  // 0.0 bis Distanz
  totalDist: number; // Gesamtdistanz der Strecke
  active: boolean;   // Ist der Impuls noch sichtbar?
}

export default function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });
  const neuronsRef = useRef<Neuron[]>([]);
  const pulsesRef = useRef<Pulse[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { 
      alpha: true, // Transparenz erlauben
    });
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    // --- 1. Initialisierung des Netzwerks ---
    const initNetwork = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      
      // Retina/HiDPI Support für gestochen scharfe Linien
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      // Anzahl der Neuronen basierend auf Fläche berechnen
      const area = width * height;
      const numNeurons = Math.floor(area * CONFIG.neuronDensity);
      
      const newNeurons: Neuron[] = [];

      // Neuronen erstellen
      for (let i = 0; i < numNeurons; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        newNeurons.push({
          x, y,
          baseX: x,
          baseY: y,
          vx: 0,
          vy: 0,
          connections: [],
        });
      }

      // Verbindungen berechnen (O(N^2) ist ok für N < 300 bei Init)
      for (let i = 0; i < numNeurons; i++) {
        for (let j = i + 1; j < numNeurons; j++) {
          const dx = newNeurons[i].x - newNeurons[j].x;
          const dy = newNeurons[i].y - newNeurons[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < CONFIG.connectionDistance) {
            newNeurons[i].connections.push(j);
            newNeurons[j].connections.push(i);
          }
        }
      }

      neuronsRef.current = newNeurons;
      pulsesRef.current = []; // Reset pulses on resize
    };

    // --- 2. Physik & Logik Update ---
    const updatePhysics = () => {
      const neurons = neuronsRef.current;
      const mouse = mouseRef.current;

      for (let i = 0; i < neurons.length; i++) {
        const n = neurons[i];

        // A. Federkraft zurück zum Ursprung (Hooke's Law)
        const dxBase = n.baseX - n.x;
        const dyBase = n.baseY - n.y;
        
        n.vx += dxBase * CONFIG.springStiffness;
        n.vy += dyBase * CONFIG.springStiffness;

        // B. Maus-Interaktion (Abstoßung/Anziehung)
        // Wir nutzen hier Anziehung für einen organischen "Folge"-Effekt
        if (mouse.active) {
          const dxMouse = mouse.x - n.x;
          const dyMouse = mouse.y - n.y;
          const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

          if (distMouse < CONFIG.mouseInteractionRadius) {
            // Kraft wird stärker, je näher die Maus ist
            const force = (1 - distMouse / CONFIG.mouseInteractionRadius) * CONFIG.mouseForce;
            
            // Sanfte Anziehung zur Maus
            n.vx += dxMouse * force;
            n.vy += dyMouse * force;
          }
        }

        // C. Reibung (Damping) - verhindert unendliches Schwingen
        n.vx *= CONFIG.damping;
        n.vy *= CONFIG.damping;

        // D. Position updaten
        n.x += n.vx;
        n.y += n.vy;
      }
    };

    // --- 3. Rendering ---
    const draw = () => {
      // Clear Canvas
      ctx.clearRect(0, 0, width, height);
      
      const neurons = neuronsRef.current;
      const pulses = pulsesRef.current;

      // Globaler Stil für Linien
      ctx.lineWidth = 1;
      
      // A. Verbindungen zeichnen (Statisch / Dimmed)
      ctx.strokeStyle = `rgba(${CONFIG.baseColor}, ${CONFIG.baseOpacity})`;
      ctx.beginPath();
      for (let i = 0; i < neurons.length; i++) {
        const nA = neurons[i];
        for (const targetIdx of nA.connections) {
          // Nur zeichnen, wenn Ziel-Index größer ist (verhindert doppeltes Zeichnen)
          if (targetIdx > i) {
            const nB = neurons[targetIdx];
            ctx.moveTo(nA.x, nA.y);
            ctx.lineTo(nB.x, nB.y);
          }
        }
      }
      ctx.stroke();

      // B. Impulse zeichnen (Das Highlight!)
      // Wir nutzen 'lighter' für einen Glüheffekt wenn sich Pulse überlagern
      ctx.globalCompositeOperation = "lighter"; 
      
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i];
        const nA = neurons[p.fromIndex];
        const nB = neurons[p.toIndex];

        // Position des Impuls-Kopfes berechnen
        // Wir müssen die aktuellen Positionen nutzen, da sich Punkte bewegen!
        const dx = nB.x - nA.x;
        const dy = nB.y - nA.y;
        const currentDist = Math.sqrt(dx * dx + dy * dy);
        
        // Fortschritt
        p.progress += CONFIG.signalSpeed;
        
        if (p.progress >= currentDist) {
          // Impuls angekommen -> entfernen
          pulses.splice(i, 1);
          continue;
        }

        // Zeichne den Impuls als Gradient (Kometenschweif)
        const t = p.progress / currentDist;
        const headX = nA.x + dx * t;
        const headY = nA.y + dy * t;
        
        // Länge des Schweifs in Prozent (abhängig von Distanz)
        const tailLengthPct = Math.min(CONFIG.signalLength / currentDist, t);
        const tailX = nA.x + dx * (t - tailLengthPct);
        const tailY = nA.y + dy * (t - tailLengthPct);

        const gradient = ctx.createLinearGradient(tailX, tailY, headX, headY);
        gradient.addColorStop(0, `rgba(${CONFIG.signalColor}, 0)`); // Schweifende transparent
        gradient.addColorStop(1, `rgba(${CONFIG.signalColor}, 1)`); // Kopf hell

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(headX, headY);
        ctx.stroke();
      }

      // Reset Composite
      ctx.globalCompositeOperation = "source-over";

      // C. Neuronen (Punkte) zeichnen
      ctx.fillStyle = `rgba(${CONFIG.baseColor}, 0.5)`;
      for (let i = 0; i < neurons.length; i++) {
        const n = neurons[i];
        ctx.beginPath();
        ctx.arc(n.x, n.y, CONFIG.particleSize, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const loop = () => {
      updatePhysics();
      draw();
      animationFrameId = requestAnimationFrame(loop);
    };

    // Events
    const handleResize = () => initNetwork();
    
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY, active: true };
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    const handleClick = (e: MouseEvent) => {
      const clickX = e.clientX;
      const clickY = e.clientY;
      
      // 1. Finde das nächste Neuron
      let closestIdx = -1;
      let minDist = Infinity;
      
      const neurons = neuronsRef.current;
      
      for (let i = 0; i < neurons.length; i++) {
        const dx = neurons[i].x - clickX;
        const dy = neurons[i].y - clickY;
        const dist = dx * dx + dy * dy; // Squared dist is faster
        
        if (dist < minDist) {
          minDist = dist;
          closestIdx = i;
        }
      }

      // 2. Sende Impulse an ALLE verbundenen Nachbarn
      if (closestIdx !== -1 && minDist < 200 * 200) { // Max Klick-Radius checken
        const startNode = neurons[closestIdx];
        
        // Visuelles Feedback am Klick-Punkt (Optional: kleiner Blitz-Effekt durch Radius-Vergrößerung könnte hier hin)
        // Wir feuern einfach Impulse ab:
        startNode.connections.forEach(targetIdx => {
          pulsesRef.current.push({
            fromIndex: closestIdx,
            toIndex: targetIdx,
            progress: 0,
            totalDist: 0, // Wird im Draw berechnet, da dynamisch
            active: true
          });
        });
      }
    };

    // Start
    initNetwork();
    loop();

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("click", handleClick);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 transition-opacity duration-1000"
      style={{
        opacity: 0.6, // Gesamt-Intensität steuerbar via CSS
        pointerEvents: "auto", // WICHTIG damit Klicks ankommen
      }}
    />
  );
}