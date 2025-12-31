"use client";

import { useCallback, useMemo } from "react";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import type { Engine, ISourceOptions } from "tsparticles-engine";

export default function NeuralBackground() {
  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  // Konfiguration für neuronale Aktivität
  const particlesOptions: ISourceOptions = useMemo(
    () => ({
      background: {
        color: {
          value: "transparent",
        },
      },
      fpsLimit: 60,
      particles: {
        number: {
          value: 50, // Mehr Partikel für mehr Verbindungen
          density: {
            enable: true,
            area: 800,
          },
        },
        color: {
          value: [
            "hsl(184, 96%, 15%)", // Dunkles Teal für Basis-Neuronen
            "hsl(225, 17%, 35%)", // Slate für Variation
            "hsl(14, 100%, 50%)", // Primary Orange für Firing-Signale
          ],
        },
        shape: {
          type: "circle",
        },
        opacity: {
          value: { min: 0.4, max: 0.9 }, // Variable Opazität
          animation: {
            enable: true,
            speed: 1,
            sync: false,
            destroy: "none",
            startValue: "random",
          },
        },
        size: {
          value: { min: 1, max: 3 }, // Variable Größe
          animation: {
            enable: true,
            speed: 2,
            sync: false,
            destroy: "none",
            startValue: "random",
          },
        },
        move: {
          enable: true,
          speed: { min: 0.3, max: 1 }, // Variable Geschwindigkeit
          direction: "none",
          random: true,
          straight: false,
          outModes: {
            default: "out",
          },
          attract: {
            enable: true,
            rotateX: 600,
            rotateY: 1200,
          },
          // Partikel bewegen sich aufeinander zu, wenn sie verbunden sind
          path: {
            enable: false,
          },
        },
        // Firing-Effekt: Neuronen leuchten orange auf
        twinkle: {
          particles: {
            enable: true,
            frequency: 0.2, // Häufigere Firing-Events
            opacity: 1,
            color: {
              value: "hsl(14, 100%, 50%)", // Primary Orange
            },
          },
        },
      },
      interactivity: {
        detectsOn: "window",
        events: {
          onHover: {
            enable: true,
            mode: "attract", // Leichte Anziehung zur Maus
          },
          resize: true,
        },
        modes: {
          attract: {
            distance: 150,
            duration: 0.4,
            easing: "ease-out-quad",
            factor: 1,
            speed: 0.5,
          },
        },
      },
      // Verbindungslinien zwischen Neuronen mit dynamischen Signalen
      links: {
        color: {
          value: [
            "hsl(184, 96%, 12%)", // Sehr dunkles Teal für Basis-Links
            "hsl(225, 17%, 25%)", // Dunkles Slate
            "hsl(14, 100%, 50%)", // Primary Orange für Firing-Signale
          ],
        },
        distance: 150, // Maximale Verbindungsdistanz
        enable: true,
        opacity: {
          value: { min: 0.1, max: 0.4 }, // Dynamische Opazität für Signal-Effekt
          animation: {
            enable: true,
            speed: 3, // Schnelle Animation für wandernde Signale
            sync: false,
            destroy: "none",
            startValue: "random",
          },
        },
        width: {
          value: { min: 0.3, max: 1.2 }, // Variable Breite für Signal-Effekt
          animation: {
            enable: true,
            speed: 4, // Schnelle Animation
            sync: false,
            destroy: "none",
            startValue: "random",
          },
        },
        triangles: {
          enable: false,
        },
        consent: false,
        warp: false,
      },
      detectRetina: true,
    }),
    []
  );

  return (
    <div
      className="fixed inset-0 -z-[1] pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      <Particles
        id="neural-background"
        init={particlesInit}
        options={particlesOptions}
        className="absolute inset-0 w-full h-full"
      />
    </div>
  );
}


