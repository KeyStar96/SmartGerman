"use client";

import { useRef, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { 
  MeshTransmissionMaterial, 
  Environment, 
  ContactShadows
} from "@react-three/drei";
import { Mesh, BoxGeometry } from "three";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useGSAP } from "@gsap/react";

interface GlassCubeCanvasProps {
  trigger?: React.RefObject<HTMLElement>;
}

/**
 * 3D-Glas-Würfel mit physikalisch korrekter Lichtbrechung
 * - MeshTransmissionMaterial mit IOR 1.5 (Standardglas)
 * - Fresnel-Effekt für Reflexion an den Kanten
 * - Chromatische Aberration (RGB-Split)
 * - Light/Dark Mode Adaptation
 * - GSAP ScrollTrigger für Rotation und Z-Position
 */
function GlassCube({ trigger }: { trigger?: React.RefObject<HTMLElement> }) {
  const meshRef = useRef<Mesh>(null);
  const materialRef = useRef<any>(null);
  const { gl } = useThree();
  
  // Theme-Detection: 0 = Light, 1 = Dark
  const [themeProgress, setThemeProgress] = useState(1); // Default: Dark
  
  // Performance: devicePixelRatio auf max 1.5 begrenzen
  useEffect(() => {
    if (gl) {
      gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    }
  }, [gl]);

  // Theme-Detection über MutationObserver
  useEffect(() => {
    const updateTheme = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setThemeProgress(isDark ? 1 : 0);
    };

    // Initial check
    updateTheme();

    // Observer für Theme-Änderungen
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // Listener für localStorage-Änderungen (falls Theme woanders geändert wird)
    const handleStorageChange = () => updateTheme();
    window.addEventListener("storage", handleStorageChange);

    return () => {
      observer.disconnect();
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // GSAP ScrollTrigger für Rotation und Z-Position
  useGSAP(() => {
    if (!meshRef.current) return;

    const triggerElement = trigger?.current || document.body;
    
    // Initial: Würfel startet von hinten (rotateX: 90)
    gsap.set(meshRef.current.rotation, {
      x: Math.PI / 2, // 90 Grad in Radian
    });
    gsap.set(meshRef.current.position, {
      z: -12,
    });

    // ScrollTrigger Timeline
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: triggerElement,
        start: "top bottom",
        end: "bottom top",
        scrub: 1,
        refreshPriority: -1,
      },
    });

    // Phase 1: Aufstellen (0-50% des Scroll-Bereichs)
    tl.to(meshRef.current.rotation, {
      x: 0,
      ease: "none",
    }, 0);

    tl.to(meshRef.current.position, {
      z: 0,
      ease: "none",
    }, 0);

    // Phase 2: Nach hinten kippen (50-100% des Scroll-Bereichs)
    tl.to(meshRef.current.rotation, {
      x: -Math.PI / 2, // -90 Grad
      ease: "none",
    }, 0.5);

    tl.to(meshRef.current.position, {
      z: 12,
      ease: "none",
    }, 0.5);

    return () => {
      tl.kill();
    };
  }, { scope: trigger?.current || document.body });

  // useFrame für Performance: Direkte Mutation ohne React-State
  useFrame(() => {
    if (!materialRef.current) return;

    // Interpolation zwischen Light- und Dark-Mode
    const lightColor = [1, 1, 1]; // Weiß
    const darkColor = [0.113, 0.113, 0.113]; // #1d1d1d in RGB (0-1)
    
    const r = lightColor[0] * (1 - themeProgress) + darkColor[0] * themeProgress;
    const g = lightColor[1] * (1 - themeProgress) + darkColor[1] * themeProgress;
    const b = lightColor[2] * (1 - themeProgress) + darkColor[2] * themeProgress;

    // Material-Eigenschaften basierend auf Theme
    materialRef.current.color.setRGB(r, g, b);
    
    // Light-Mode: niedrige Dicke, dezente Highlights
    // Dark-Mode: höhere Dicke, envMapIntensity 2.0
    const thickness = 0.5 + themeProgress * 1.5; // 0.5 (Light) bis 2.0 (Dark)
    const envMapIntensity = 0.5 + themeProgress * 1.5; // 0.5 (Light) bis 2.0 (Dark)
    
    materialRef.current.thickness = thickness;
    materialRef.current.envMapIntensity = envMapIntensity;
  });

  return (
    <mesh ref={meshRef} geometry={new BoxGeometry(2, 2, 2)}>
      <MeshTransmissionMaterial
        ref={materialRef}
        // Physikalische Eigenschaften
        transmission={1} // Vollständige Transparenz - lässt Hintergrund durchscheinen
        thickness={2} // Wird in useFrame dynamisch angepasst
        roughness={0.1} // Glatte Oberfläche
        chromaticAberration={0.15} // Chromatische Aberration (RGB-Split) - erhöht für sichtbaren Effekt
        anisotropy={0.1} // Leichte Anisotropie für realistische Reflexionen
        distortion={0.15} // Verzerrung des Hintergrunds (Text wird verzerrt)
        distortionScale={0.8} // Stärke der Verzerrung
        temporalDistortion={0.0} // Keine zeitliche Verzerrung für Performance
        
        // IOR (Index of Refraction) - Snelliussches Gesetz
        // Standardglas: ~1.5
        // n₁ sin θ₁ = n₂ sin θ₂
        ior={1.5}
        
        // Fresnel-Effekt (Schlick-Approximation)
        // R(θ) = R₀ + (1 - R₀)(1 - cos θ)⁵
        // Wird automatisch durch MeshTransmissionMaterial berechnet
        // Erhöhte Reflexion an den Kanten (grazing angles)
        
        // Performance-Optimierungen
        resolution={512} // FBO-Auflösung: 512px (kann auf 256px reduziert werden für noch bessere Performance)
        samples={8} // Samples zwischen 6-10 für Balance zwischen Qualität und Performance
        
        // Environment Map wird über <Environment /> gesetzt
        envMapIntensity={2} // Wird in useFrame dynamisch angepasst
        
        // Farbe wird in useFrame basierend auf Theme gesetzt
        color="#ffffff"
      />
    </mesh>
  );
}

/**
 * Canvas-Komponente für den 3D-Glas-Würfel
 * Wird nur client-seitig gerendert
 */
export default function GlassCubeCanvas({ trigger }: GlassCubeCanvasProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 50 }}
      gl={{ 
        antialias: true,
        alpha: true,
        // Performance: devicePixelRatio wird in GlassCube gesetzt
        // WICHTIG: alpha: true ermöglicht, dass der Webseiten-Hintergrund durchscheint
        // und durch das Glas verzerrt wird
      }}
      style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}
    >
      {/* Environment Map - Unsichtbare Lichtquelle */}
      <Environment 
        preset="studio" 
        background={false} // Wichtig: Map nur in Reflexionen, nicht als Hintergrund
      />
      
      {/* Licht für bessere Beleuchtung */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      
      {/* 3D-Glas-Würfel - verzerrt den Webseiten-Hintergrund (und indirekt den Text) */}
      <GlassCube trigger={trigger} />
      
      {/* ContactShadows für Erdung */}
      <ContactShadows
        position={[0, -1.5, 0]}
        opacity={0.4}
        scale={5}
        blur={2}
        far={2}
      />
    </Canvas>
  );
}

