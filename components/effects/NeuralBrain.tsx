"use client";

import { useRef, useEffect, useState } from "react";
import * as THREE from "three";


// --- CONFIG ---
const CONFIG = {
    neuronDensity: 30,
    connectionDistance: 0.35,
    minConnectionDistance: 0.15,
    wanderRadius: 0.025,
    wanderSpeed: 0.01,
    springStiffness: 0.04,
    maxConnections: 6,

    // Signals
    signalSpeed: 1.25,
    minSignalStrength: 0.05,
    trailDecay: 2.0,

    particleSize: 0.035, // Base size

    // Theme Colors
    colorIdleDark: 0xE0E0E0,
    colorIdleLight: 0x444444,

    // Heat Palette for Signals (Red -> Orange -> Gold)
    colorLow: 0xCC3300,
    colorMid: 0xFF9900,
    colorHigh: 0xFFC000,

    // Auto Pulse
    autoPulseEnabled: true,
    autoPulseInterval: 10,
};

// --- TYPES ---
interface Neuron {
    id: number;
    vec: THREE.Vector3;      // Position (Z will be 0)
    baseVec: THREE.Vector3;  // Base Position
    velocity: THREE.Vector3;
    connections: number[];
    flash: number;
    visualDepth: number;     // 0 (Back) to 1 (Front)
    phase: number;
}

interface Pulse {
    active: boolean;
    fromIdx: number;
    toIdx: number;
    progress: number;
    strength: number;
    trailIntensity: number;
    hasTriggered: boolean;
    lineIdx: number;
}

export default function NeuralBrain() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [opacity, setOpacity] = useState(0);

    useEffect(() => {
        if (!containerRef.current) return;

        // --- 1. SETUP THREE.JS ---
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        const scene = new THREE.Scene();

        const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
        // Z=0 Plane View
        camera.position.set(0, 0, 4.5);

        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);
        containerRef.current.appendChild(renderer.domElement);

        setTimeout(() => setOpacity(1), 100);

        // --- 2. GENERATE BRAIN STRUCTURE (2D Plane) ---
        // Expanded area to prevent "flat sides" when container is non-square or large
        const areaMultiplier = 2.5;
        const particleCount = Math.floor(400 * CONFIG.neuronDensity * 1.5); // Increased count
        const neurons: Neuron[] = [];

        // Bounding box for generation (2D) - Significantly larger
        const genBounds = { x: 4.0, y: 3.0 };

        for (let i = 0; i < particleCount; i++) {
            const testP = {
                x: (Math.random() - 0.5) * 2 * genBounds.x,
                y: (Math.random() - 0.5) * 2 * genBounds.y
            };

            // Z is strictly 0 for physics
            const z = 0;

            // Visual Depth: 0 (Far/Sharp/Small) -> 1 (Near/Blurry/Large)
            const visualDepth = Math.random();

            neurons.push({
                id: neurons.length,
                vec: new THREE.Vector3(testP.x, testP.y, z),
                baseVec: new THREE.Vector3(testP.x, testP.y, z),
                velocity: new THREE.Vector3(0, 0, 0),
                connections: [],
                flash: 0,
                visualDepth: visualDepth,
                phase: Math.random() * Math.PI * 2
            });
        }

        // --- 3. CREATE CONNECTIONS ---
        const connectionPairs: { from: number; to: number; dist: number }[] = [];
        const maxDistSq = CONFIG.connectionDistance * CONFIG.connectionDistance;
        const minDistSq = CONFIG.minConnectionDistance * CONFIG.minConnectionDistance;

        for (let i = 0; i < neurons.length; i++) {
            const n1 = neurons[i];
            let connCount = 0;
            for (let j = i + 1; j < neurons.length; j++) {
                if (connCount >= CONFIG.maxConnections) break;
                const n2 = neurons[j];

                // 2D Distance Check (Z is ignored as it is 0)
                const dSq = n1.vec.distanceToSquared(n2.vec);

                if (dSq < maxDistSq && dSq > minDistSq) {
                    n1.connections.push(j);
                    n2.connections.push(i);
                    connectionPairs.push({ from: i, to: j, dist: Math.sqrt(dSq) });
                    connCount++;
                }
            }
        }

        // --- 4. GEOMETRY SETUP ---

        // A. Particles (Points)
        const particlesGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(neurons.length * 3);
        const phases = new Float32Array(neurons.length);
        const flashes = new Float32Array(neurons.length);
        const visualDepths = new Float32Array(neurons.length);

        neurons.forEach((n, i) => {
            positions[i * 3] = n.vec.x;
            positions[i * 3 + 1] = n.vec.y;
            positions[i * 3 + 2] = n.vec.z;
            phases[i] = Math.random() * Math.PI * 2;
            flashes[i] = 0.0;
            visualDepths[i] = n.visualDepth;
        });

        particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
        particlesGeo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
        particlesGeo.setAttribute('aFlash', new THREE.BufferAttribute(flashes, 1).setUsage(THREE.DynamicDrawUsage));
        particlesGeo.setAttribute('aVisualDepth', new THREE.BufferAttribute(visualDepths, 1));

        // Custom Shader for Depth Effect
        const particlesMat = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uExpansion: { value: 0 }, // 0 = Collapsed, 1 = Full
                uColorIdle: { value: new THREE.Color(CONFIG.colorIdleDark) },
                uColorLow: { value: new THREE.Color(CONFIG.colorLow) },
                uColorMid: { value: new THREE.Color(CONFIG.colorMid) },
                uColorHigh: { value: new THREE.Color(CONFIG.colorHigh) },
                uSize: { value: CONFIG.particleSize * 450 }
            },
            vertexShader: `
                uniform float uTime;
                uniform float uSize;
                uniform float uExpansion;
                attribute float aPhase;
                attribute float aFlash;
                attribute float aVisualDepth; // 0..1
                
                varying float vFlash;
                varying float vPhase;
                varying float vVisualDepth;
                
                void main() {
                    // Wander Logic (GPU)
                    // Matches "organic" movement
                    vec3 offset = vec3(
                        sin(uTime * 0.5 + aPhase), 
                        cos(uTime * 0.4 + aPhase * 0.9), 
                        0.0
                    ) * 0.04; // 0.04 matches prev wander radius approx

                    vec3 finalPos = (position + offset) * uExpansion;

                    vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
                    gl_Position = projectionMatrix * mvPosition;
                    
                    vFlash = aFlash;
                    vPhase = aPhase;
                    vVisualDepth = aVisualDepth;

                    // Pulsate
                    float breath = 0.1 * sin(uTime * 1.5 + aPhase); 
                    float flashGrow = smoothstep(0.0, 2.0, aFlash) * 1.0; 
                    float pulse = 1.0 + breath + flashGrow;
                    
                    // --- OPTICAL ILLUSION: SIZE ---
                    // Front (Depth 1) -> Large
                    // Back (Depth 0) -> Small
                    // Range: 0.5x to 1.5x base size
                    float depthScale = 0.5 + aVisualDepth * 1.0;

                    // Perspective divide (standard) + Depth Scale
                    gl_PointSize = uSize * pulse * depthScale * (1.0 / -mvPosition.z);
                }
            `,
            fragmentShader: `
                uniform float uTime;
                uniform vec3 uColorIdle;
                uniform vec3 uColorLow;
                uniform vec3 uColorMid;
                uniform vec3 uColorHigh;
                
                varying float vFlash;
                varying float vPhase;
                varying float vVisualDepth;
                
                vec3 getHeatColor(float i) {
                    vec3 c = mix(uColorLow, uColorMid, smoothstep(0.0, 0.6, i));
                    c = mix(c, uColorHigh, smoothstep(0.6, 2.0, i));
                    return c;
                }

                void main() {
                    vec2 coord = gl_PointCoord - vec2(0.5);
                    float dist = length(coord);
                    
                    if(dist > 0.5) discard;
                    
                    // --- OPTICAL ILLUSION: BLUR ---
                    // Back (Depth 0) -> Sharp Edge
                    // Front (Depth 1) -> Soft/Blurry Edge
                    
                    // Sharp: smoothstep(0.40, 0.50)
                    // Blur:  smoothstep(0.00, 0.50)
                    
                    // Interpolate edge hardness based on depth
                    float edgeInner = mix(0.40, 0.0, vVisualDepth);
                    float alpha = 1.0 - smoothstep(edgeInner, 0.5, dist);
                    
                    // Tone down alpha heavily for "blocked" fuzzy front particles
                    // to imitate "out of focus" transparency
                    float maxAlpha = mix(1.0, 0.6, vVisualDepth);
                    alpha *= maxAlpha;

                    // --- COLOR LOGIC ---
                    
                    // Idle
                    float breath = 0.5 + 0.5 * sin(uTime * 2.0 + vPhase);
                    vec3 idleState = mix(uColorIdle, uColorIdle * 1.2, breath * 0.3);
                    
                    // Heat
                    vec3 heatState = getHeatColor(vFlash);
                    
                    // Mix
                    float warmth = smoothstep(0.0, 1.0, vFlash);   
                    vec3 finalColor = mix(idleState, heatState, warmth);
                    
                    // White Core (Only for sharp back particles? Or all?)
                    // Let's keep it for all but maybe less distinct on blurry ones
                    if (vFlash > 1.5 && dist < 0.2) {
                        finalColor += vec3(0.3) * (vFlash - 1.5);
                    }
                    
                    // Boost Alpha on flash
                    alpha = max(alpha, alpha * (0.6 + min(vFlash, 2.0)));

                    gl_FragColor = vec4(finalColor, alpha);
                }
            `,
            depthWrite: false
        });

        const particleSystem = new THREE.Points(particlesGeo, particlesMat);
        particleSystem.matrixAutoUpdate = false;
        scene.add(particleSystem);


        // B. Connections (Lines)
        const linesGeo = new THREE.BufferGeometry();
        const linePositions = new Float32Array(connectionPairs.length * 2 * 3);
        const lineProgress = new Float32Array(connectionPairs.length * 2);
        const signalData = new Float32Array(connectionPairs.length * 2 * 2);
        const distData = new Float32Array(connectionPairs.length * 2);
        const linePhases = new Float32Array(connectionPairs.length * 2);

        for (let i = 0; i < connectionPairs.length; i++) {
            const pair = connectionPairs[i];
            const n1 = neurons[pair.from];
            const n2 = neurons[pair.to];

            // Fill Positions (Static Base)
            const idx = i * 6;
            linePositions[idx] = n1.vec.x;
            linePositions[idx + 1] = n1.vec.y;
            linePositions[idx + 2] = n1.vec.z;

            linePositions[idx + 3] = n2.vec.x;
            linePositions[idx + 4] = n2.vec.y;
            linePositions[idx + 5] = n2.vec.z;

            // Fill Attributes
            lineProgress[i * 2] = 0.0;
            distData[i * 2] = pair.dist;
            linePhases[i * 2] = n1.phase;

            lineProgress[i * 2 + 1] = 1.0;
            distData[i * 2 + 1] = pair.dist;
            linePhases[i * 2 + 1] = n2.phase;
        }

        linesGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3).setUsage(THREE.DynamicDrawUsage));
        linesGeo.setAttribute('aLineProgress', new THREE.BufferAttribute(lineProgress, 1));
        linesGeo.setAttribute('aSignal', new THREE.BufferAttribute(signalData, 2).setUsage(THREE.DynamicDrawUsage));
        linesGeo.setAttribute('aDist', new THREE.BufferAttribute(distData, 1));
        linesGeo.setAttribute('aPhase', new THREE.BufferAttribute(linePhases, 1));

        const linesMat = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uExpansion: { value: 0 }, // 0 = Collapsed, 1 = Full
                uColorIdle: { value: new THREE.Color(CONFIG.colorIdleDark) },
                uColorLow: { value: new THREE.Color(CONFIG.colorLow) },
                uColorMid: { value: new THREE.Color(CONFIG.colorMid) },
                uColorHigh: { value: new THREE.Color(CONFIG.colorHigh) },
                uOpacityBase: { value: 0.08 },
            },
            transparent: true,
            vertexShader: `
                uniform float uTime;
                uniform float uExpansion;
                attribute float aLineProgress;
                attribute vec2 aSignal; 
                attribute float aDist;
                attribute float aPhase; // Phase of the attached neuron
                
                varying float vProgress;
                varying vec2 vSignal;
                varying float vDist;
                
                void main() {
                    vProgress = aLineProgress;
                    vSignal = aSignal;
                    vDist = aDist;

                    // Wander Logic (Match Particles)
                    vec3 offset = vec3(
                        sin(uTime * 0.5 + aPhase), 
                        cos(uTime * 0.4 + aPhase * 0.9), 
                        0.0
                    ) * 0.04;

                    vec3 finalPos = (position + offset) * uExpansion;
                    vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform vec3 uColorIdle;
                uniform vec3 uColorLow;
                uniform vec3 uColorMid;
                uniform vec3 uColorHigh;
                uniform float uOpacityBase;
                
                varying float vProgress;
                varying vec2 vSignal;
                varying float vDist;
                
                vec3 getHeatColor(float i) {
                    // 0.0 - 0.4: Low (Red) -> Mid (Orange)
                    // 0.4 - 0.8: Mid (Orange) -> High (Gold/Bright)
                    vec3 c = mix(uColorLow, uColorMid, smoothstep(0.0, 0.4, i));
                    c = mix(c, uColorHigh, smoothstep(0.4, 0.8, i));
                    return c;
                }

                void main() {
                    float signalProgress = vSignal.x;
                    float rawStrength = vSignal.y;
                    float signalStrength = abs(rawStrength);
                    
                    vec3 finalColor = uColorIdle;
                    float finalOpacity = uOpacityBase;
                    
                    if (signalStrength > 0.01) {
                        bool isReverse = rawStrength < 0.0;
                        float distUV = isReverse ? (vProgress - signalProgress) : (signalProgress - vProgress);
                        
                        float distWorld = distUV * vDist;

                        if (distWorld >= 0.0) {
                            float tailLen = 0.6; // Reduced tail length for clearer pulse
                            float glow = max(0.0, 1.0 - (distWorld / tailLen));
                            
                            if (glow > 0.0) {
                                vec3 trailColor = getHeatColor(signalStrength);
                                trailColor *= 2.0;

                                if (distWorld < 0.05) {
                                     trailColor = mix(trailColor, uColorHigh, 0.6);
                                }
                                
                                finalColor = mix(finalColor, trailColor, glow);
                                finalOpacity = max(finalOpacity, glow * signalStrength * 6.0);
                            }
                        }
                    }
                    gl_FragColor = vec4(finalColor, finalOpacity);
                }
            `,
            depthWrite: false
        });

        const linesMesh = new THREE.LineSegments(linesGeo, linesMat);
        linesMesh.matrixAutoUpdate = false;
        scene.add(linesMesh);

        const connectionMap = new Map<string, number>();
        connectionPairs.forEach((pair, idx) => {
            connectionMap.set(`${Math.min(pair.from, pair.to)}-${Math.max(pair.from, pair.to)}`, idx);
        });

        // --- THEME DETECTION ---
        const updateTheme = () => {
            const isDark = document.documentElement.classList.contains("dark");
            const newColor = new THREE.Color(isDark ? CONFIG.colorIdleDark : CONFIG.colorIdleLight);
            const newBlending = isDark ? THREE.AdditiveBlending : THREE.NormalBlending;

            particlesMat.uniforms.uColorIdle.value.copy(newColor);
            particlesMat.blending = newBlending;
            particlesMat.needsUpdate = true;

            linesMat.uniforms.uColorIdle.value.copy(newColor);
            linesMat.blending = newBlending;
            linesMat.needsUpdate = true;
        };

        updateTheme();

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === "attributes" && mutation.attributeName === "class") {
                    updateTheme();
                }
            });
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

        // --- 5. SIGNAL LOGIC ---
        const pulsePool: Pulse[] = [];
        const maxPulses = 2000;
        for (let i = 0; i < maxPulses; i++) {
            pulsePool.push({ active: false, fromIdx: 0, toIdx: 0, progress: 0, strength: 0, trailIntensity: 0, hasTriggered: false, lineIdx: -1 });
        }

        const dirtyLines: number[] = [];

        const spawnPulse = (from: number, to: number, strength: number, startProgress = 0.0) => {
            const key = `${Math.min(from, to)}-${Math.max(from, to)}`;
            const lineIdx = connectionMap.get(key);
            if (lineIdx === undefined) return;

            const p = pulsePool.find(p => !p.active);
            if (p) {
                p.active = true;
                p.fromIdx = from;
                p.toIdx = to;
                p.progress = startProgress;
                p.strength = strength;
                p.trailIntensity = strength;
                p.hasTriggered = false;
                p.lineIdx = lineIdx;
            }
        };

        const triggerNeuron = () => {
            const idx = Math.floor(Math.random() * neurons.length);
            const n = neurons[idx];
            n.flash += 2.0;

            setTimeout(() => {
                n.connections.forEach(target => spawnPulse(idx, target, 3.0)); // Start very bright
            }, 500);
        };

        // --- 6. ANIMATION LOOP ---
        const clock = new THREE.Clock();
        // --- 6. VISIBILITY & ANIMATION LOOP ---
        const expansionRef = useRef(0);
        const requestRef = useRef<number>();
        const isVisibleRef = useRef(false);
        const lastTimeRef = useRef(0);

        const animate = (time: number) => {
            // Keep reference for loop
            requestRef.current = requestAnimationFrame(animate);

            // Time Delta
            const dt = Math.min((time - lastTimeRef.current) / 1000, 0.1);
            lastTimeRef.current = time;

            // --- EXPANSION/COLLAPSE ANIMATION ---
            const targetExpansion = isVisibleRef.current ? 1.0 : 0.0;
            const currentExp = expansionRef.current;

            // Smooth Lerp
            const newExp = currentExp + (targetExpansion - currentExp) * 0.05; // Adjust speed here
            expansionRef.current = newExp;

            // Apply Uniforms
            particlesMat.uniforms.uExpansion.value = newExp;
            linesMat.uniforms.uExpansion.value = newExp;

            // --- STOP OPTIMIZATION ---
            // If we are aiming for 0 (hidden) and practically there, STOP the loop
            if (targetExpansion === 0 && newExp < 0.001) {
                if (requestRef.current) {
                    cancelAnimationFrame(requestRef.current);
                    requestRef.current = undefined;
                    // Ensure it is strictly 0
                    particlesMat.uniforms.uExpansion.value = 0;
                    linesMat.uniforms.uExpansion.value = 0;
                }
                return; // Stop execution
            }

            // Normal Animation Update
            particlesMat.uniforms.uTime.value = time * 0.001;
            linesMat.uniforms.uTime.value = time * 0.001;

            const flashArray = particlesGeo.attributes.aFlash.array as Float32Array;

            // Update Neurons (only Flash state)
            for (let i = 0; i < neurons.length; i++) {
                const n = neurons[i];

                if (n.flash > 0) {
                    n.flash = Math.max(0, n.flash - dt * 0.5);
                    n.flash = Math.min(n.flash, 4.0);
                }
                flashArray[i] = n.flash;
            }
            (particlesGeo.attributes.aFlash as THREE.BufferAttribute).needsUpdate = true;

            // Signal Logic
            const signalAttr = linesGeo.attributes.aSignal as THREE.BufferAttribute;
            const signalArray = signalAttr.array as Float32Array;

            // Reset "Active" lines first (Optimization)
            // Ideally we track which lines are dirty, but iterating all lines for clear is safest for now 
            // OR use dirtyLines again (let's use dirtyLines for cleanup)

            // Auto Pulse
            if (CONFIG.autoPulseEnabled) {
                const interval = CONFIG.autoPulseInterval / 1000;
                if (time * 0.001 % interval < dt) {
                    // Trigger multiple per frame
                    for (let k = 0; k < 3; k++) triggerNeuron();
                }
            }

            // Clean previous dirty signals (Reset to 0 if not updated this frame? No, we need persistence)
            // Actually, we need to clear updated signals from previous frame if they finished?
            // The logic: Signal array contains current signal states.
            // We just need to update active pulses.

            // We need to zero out signals that are NOT active anymore?
            // Since we share the buffer, it's tricky.
            // Strategy: Zero out ALL lines every frame? Or just active ones?
            // Zeroing all 2000 lines * 4 floats is cheap.
            // Let's optimize: Only clear lines that were active last frame.

            // For simplicity and correctness: 
            // We'll iterate pulsePool and update. 
            // BUT we must clear the specific line slot before writing if multiple pulses (not supported yet)
            // Current shader supports 1 pulse per line direction effectively (mix).
            // Let's just Loop over active pulses.

            // Problem: If a pulse finishes, we need to clear the line on the GPU.
            // We can track "dirtyLines" to clear them.

            dirtyLines.forEach(lineIdx => {
                const v1 = lineIdx * 4;
                signalArray[v1] = 0;
                signalArray[v1 + 1] = 0;
                const v2 = v1 + 2; // fix lint later
                signalArray[v2] = 0;
                signalArray[v1 + 3] = 0;
            });
            dirtyLines.length = 0;

            pulsePool.forEach(p => {
                if (!p.active) return;
                const lineIdx = p.lineIdx;
                const dist = connectionPairs[lineIdx].dist;
                p.progress += (CONFIG.signalSpeed * dt) / dist;

                let shaderProgress = p.progress;
                const isReverse = p.fromIdx !== connectionPairs[lineIdx].from;
                if (isReverse) shaderProgress = 1.0 - p.progress;

                let encodedStrength = p.strength;   // Default to start strength

                // --- VISUAL DECAY DURING TRAVEL ---
                // "Light signal decreases luminosity with the path"
                const travelDecay = Math.exp(-dist * p.progress * 2.5);
                const currentStrength = p.strength * travelDecay;

                if (isReverse) encodedStrength = -currentStrength;
                else encodedStrength = currentStrength;

                const v1 = lineIdx * 4;
                signalArray[v1] = shaderProgress;
                signalArray[v1 + 1] = encodedStrength;

                const v2 = v1 + 2;
                signalArray[v2] = shaderProgress;
                signalArray[v2 + 1] = encodedStrength;

                dirtyLines.push(lineIdx);

                if (!p.hasTriggered && p.progress >= 1.0) {
                    const targetN = neurons[p.toIdx];

                    // "Neuron lights up in same intensity as signal reached it"
                    targetN.flash += currentStrength;

                    // "Sends new signal with reduced intensity" (Immediate, no delay)
                    // We treat "reduced" as the value it arrived with.
                    if (currentStrength > CONFIG.minSignalStrength) {
                        // Spread to others
                        targetN.connections.forEach(mateIdx => {
                            // Don't send back to sender immediately (optional simple block)
                            if (mateIdx !== p.fromIdx) {
                                spawnPulse(p.toIdx, mateIdx, currentStrength, 0.0);
                            }
                        });
                    }
                    p.hasTriggered = true;
                }

                if (p.progress >= 1.0 + (CONFIG.trailDecay / dist)) { // Wait for trail to finish
                    p.active = false;
                }
            });

            signalAttr.needsUpdate = true;

            renderer.render(scene, camera);
        };

        const startLoop = () => {
            if (!requestRef.current) {
                lastTimeRef.current = performance.now();
                animate(performance.now());
            }
        };

        const intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                isVisibleRef.current = entry.isIntersecting;
                if (entry.isIntersecting) {
                    startLoop();
                }
            });
        }, { threshold: 0.1 }); // 10% visible to start

        intersectionObserver.observe(containerRef.current);

        // --- 7. RESIZE & CLEANUP ---
        const resizeObserver = new ResizeObserver(() => {
            if (!containerRef.current) return;
            const newW = containerRef.current.clientWidth;
            const newH = containerRef.current.clientHeight;

            camera.aspect = newW / newH;
            camera.updateProjectionMatrix();
            renderer.setSize(newW, newH);
        });

        resizeObserver.observe(containerRef.current);

        return () => {
            observer.disconnect();
            resizeObserver.disconnect();

            if (containerRef.current && renderer.domElement) {
                containerRef.current.removeChild(renderer.domElement);
            }
            particlesGeo.dispose();
            particlesMat.dispose();
            linesGeo.dispose();
            linesMat.dispose();
            renderer.dispose();
        };

    }, []);

    return (
        <div
            ref={containerRef}
            className="w-full h-full transition-opacity duration-1000 ease-in-out cursor-pointer"
            style={{ opacity: opacity }}
            title="Click to interact"
        />
    );
}