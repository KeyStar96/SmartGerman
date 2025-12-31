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
          value: 30, // Minimale Partikel für 60fps Performance
          density: {
            enable: true,
            area: 800,
          },
        },
        color: {
          value: [
            "hsl(184, 96%, 15%)", // Dunkles Teal für Basis-Neuronen
            "hsl(225, 17%, 35%)", // Slate für Variation
            "hsl(14, 100%, 50%)", // Primary Orange für Firing-Effekte
          ],
        },
        shape: {
          type: "circle",
        },
        opacity: {
          value: { min: 0.3, max: 0.6 }, // Dezente Sichtbarkeit
          animation: {
            enable: true,
            speed: 0.5,
            sync: false,
          },
        },
        size: {
          value: { min: 1, max: 2 }, // Winzige Neuronen
          animation: {
            enable: true,
            speed: 2,
            sync: false,
          },
        },
        move: {
          enable: true,
          speed: 0.3, // Langsame, subtile Bewegung
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
        },
        // Firing-Effekt: Gelegentliche Orange-Impulse
        twinkle: {
          particles: {
            enable: true,
            frequency: 0.05, // Sehr seltene Firing-Events
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
      // Verbindungslinien zwischen Neuronen
      links: {
        color: {
          value: [
            "hsl(184, 96%, 12%)", // Sehr dunkles Teal
            "hsl(225, 17%, 25%)", // Dunkles Slate
            "hsl(14, 100%, 50%)", // Primary Orange für Firing-Effekte
          ],
        },
        distance: 120, // Maximale Verbindungsdistanz
        enable: true,
        opacity: {
          value: 0.08, // Extrem dezente Opazität (0.05-0.1 wie gefordert)
          animation: {
            enable: true,
            speed: 1,
            sync: false,
            destroy: "none",
            startValue: "random",
          },
        },
        width: 0.5, // Feine Linien
        triangles: {
          enable: false,
        },
        // Firing-Effekt: Gelegentliche Orange-Impulse auf Links
        shadow: {
          enable: false,
        },
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

