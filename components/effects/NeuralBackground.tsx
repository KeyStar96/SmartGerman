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
          value: 40, // Leicht erhöht für mehr Verbindungen und Signale
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
          value: { min: 0.4, max: 0.7 }, // Leicht erhöht für bessere Sichtbarkeit
          animation: {
            enable: true,
            speed: 0.8,
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
        // Trail-Effekt: Wandernde Signale zwischen Neuronen
        trail: {
          enable: true,
          length: 5, // Längere Spur für sichtbare Signal-Übertragung
          fill: {
            color: {
              value: "hsl(14, 100%, 50%)", // Orange für Signal-Spur
            },
          },
          delay: {
            value: 0.1,
          },
        },
        // Firing-Effekt: Gelegentliche Orange-Impulse mit Aufleuchten
        twinkle: {
          particles: {
            enable: true,
            frequency: 0.12, // Häufigere Firing-Events für sichtbare Signale
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
            "hsl(14, 100%, 50%)", // Primary Orange für Firing-Signale
          ],
        },
        distance: 120, // Maximale Verbindungsdistanz
        enable: true,
        opacity: {
          value: { min: 0.1, max: 0.2 }, // Leicht erhöht für bessere Sichtbarkeit der Verbindungen
          animation: {
            enable: true,
            speed: 2, // Schnellere Animation für dynamische Signale
            sync: false,
            destroy: "none",
            startValue: "random",
          },
        },
        width: {
          value: { min: 0.3, max: 1 }, // Variable Linienstärke für dynamischeren Effekt
          animation: {
            enable: true,
            speed: 3,
            sync: false,
            destroy: "none",
            startValue: "random",
          },
        },
        triangles: {
          enable: false,
        },
        // Firing-Effekt: Dynamische Orange-Signale auf Links
        shadow: {
          enable: false,
        },
        // Konsistente Verbindungen zwischen nahen Neuronen
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

