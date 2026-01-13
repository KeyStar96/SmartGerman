"use client";

import React, { useRef, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import * as THREE from "three";

// --- Shader Definition ---
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uMouse;
  uniform float uQuality; // 0.0 to 1.0, controlled by PerformanceMonitor

  varying vec2 vUv;

  // --- Voronoi / Cellular Noise Function ---
  // Based on IQ's cellular noise
  vec2 hash2( vec2 p ) {
    return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);
  }

  // Returns: x = distance to nearest point, y = unused/cell id
  float voronoi( in vec2 x ) {
    vec2 n = floor(x);
    vec2 f = fract(x);

    float m_dist = 1.0;

    for( int j=-1; j<=1; j++ )
    for( int i=-1; i<=1; i++ ) {
      vec2 g = vec2( float(i),float(j) );
      vec2 o = hash2( n + g );
      
      // Animate the point
      o = 0.5 + 0.5*sin( uTime*0.5 + 6.2831*o );

      vec2 r = g + o - f;
      float d = length(r);

      if( d<m_dist ) {
        m_dist = d;
      }
    }
    return m_dist;
  }

  void main() {
    // Normalize coordinates for aspect ratio
    vec2 uv = vUv;
    uv.x *= uResolution.x / uResolution.y;

    // Scale the grid for the Voronoi
    float scale = 8.0;
    
    // Low quality fallback: simpler calculation/less detail if needed (could reduce scale)
    if (uQuality < 0.5) scale = 4.0;

    float dist = voronoi(uv * scale);

    // --- Interaction ---
    // Calculate distance to mouse
    vec2 mouse = uMouse;
    mouse.x *= uResolution.x / uResolution.y;
    
    float interactionDist = length(uv - mouse);
    
    // Radius of influence for the mouse
    float radius = 0.8;
    
    // Intensity factor based on distance to mouse
    float mouseFactor = smoothstep(radius, 0.0, interactionDist);

    // --- Coloring ---
    // Base Colors
    vec3 colWhite = vec3(0.98, 0.98, 0.98); // #FAFAFA
    vec3 colGray  = vec3(0.90, 0.90, 0.90); // Light Gray for cell borders
    vec3 colOrange = vec3(1.0, 0.42, 0.0);  // #FF6B00

    // Invert distance to make cell centers white and borders gray
    // voronoi returns dist to center (0 at center, 1 at edge approx)
    // We want centers white, edges darker.
    float border = smoothstep(0.0, 0.5, dist); // Edges are closer to 1 (wait, no. center is 0)
    
    // Let's visualize the cells: dist is 0 at center, approaches 0.5-1 at border
    // We want the "web" to be visible. 
    
    // Scientific look: 
    // High values (borders) -> Gray. Low values (centers) -> White.
    vec3 baseColor = mix(colWhite, colGray, smoothstep(0.05, 0.6, dist));

    // --- Pulse Effect ---
    // Pulse only near mouse
    float pulse = sin(uTime * 3.0) * 0.5 + 0.5; // 0 to 1
    
    // Mix orange based on mouse factor and pulse
    // We want the "cells" near the mouse to glow orange slightly inside
    vec3 finalColor = mix(baseColor, colOrange, mouseFactor * 0.15 * (1.0 - dist) * (0.5 + 0.5*pulse));

    // Dark mode consideration:
    // If strict scientific minimalism is requested (Black text on White), we keep it bright.
    // If dark mode is active, the parent container should handle opacity or blending, 
    // OR we could pass a uniform. For now, we stick to the requested "White/Gray/Orange" palette.

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

const NeuralScene = () => {
    const meshRef = useRef<THREE.Mesh>(null);
    const uniforms = useMemo(
        () => ({
            uTime: { value: 0 },
            uResolution: { value: new THREE.Vector2(1, 1) },
            uMouse: { value: new THREE.Vector2(0.5, 0.5) },
            uQuality: { value: 1.0 },
        }),
        []
    );

    useFrame((state) => {
        if (!meshRef.current) return;
        const { clock, pointer, size } = state;

        const material = meshRef.current.material as THREE.ShaderMaterial;
        if (material.uniforms) {
            material.uniforms.uTime.value = clock.getElapsedTime();
            material.uniforms.uResolution.value.set(size.width, size.height);

            // Pointer is normalized (-1 to 1). Convert to 0 to 1 for shader uv space.
            // UV 0,0 is bottom-left. Pointer -1,-1 is bottom-left.
            const u = (pointer.x + 1) / 2;
            const v = (pointer.y + 1) / 2;

            // Lerp for smooth movement
            material.uniforms.uMouse.value.lerp(new THREE.Vector2(u, v), 0.1);
        }
    });

    return (
        <mesh ref={meshRef}>
            <planeGeometry args={[2, 2]} />
            <shaderMaterial
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                uniforms={uniforms}
                transparent={true} // Allow background to show if needed, though shader is opaque
            />
        </mesh>
    );
};

export default function NeuralBackground() {
    const [dpr, setDpr] = useState(1);

    return (
        <div className="absolute inset-0 w-full h-full -z-10 bg-[#FAFAFA] dark:bg-[#111111] transition-colors duration-500">
            {/* 
         Use key to force re-render if needed, but here it's static.
         eventSource={document.body} allows pointer events to work even if canvas is covered 
         (though usually 'pointer-events-none' on overlaying content blocks it).
         We want interaction, so overlapping content shouldn't block pointer if possible, 
         or we accept that interaction only works on empty spaces.
         For a background, usually we listen to global mouse, but R3F uses canvas events.
         We'll stick to canvas events for now.
       */}
            <Canvas
                camera={{ position: [0, 0, 1] }}
                dpr={dpr}
                resize={{ scroll: false }}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            >
                <PerformanceMonitor onIncline={() => setDpr(2)} onDecline={() => setDpr(1)}>
                    <NeuralScene />
                </PerformanceMonitor>
            </Canvas>
        </div>
    );
}
