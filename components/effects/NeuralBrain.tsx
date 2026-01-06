"use client";

import { useRef, useEffect, useState } from "react";
import * as THREE from "three";


// --- CONFIG ---
const CONFIG = {
    neuronDensity: 0.04,
    connectionDistance: 1.2,
    wanderRadius: 0.3,       // Increased for visible movement
    wanderSpeed: 0.5,        // Faster movement
    springStiffness: 0.04,

    // Signals
    signalSpeed: 1.25,
    signalDecay: 0.85, // Slower decay for longer life
    minSignalStrength: 0.1,
    trailDecay: 2.0,

    particleSize: 0.035,
    colorNeuron: 0xFFFFFF,

    // Gradient Palette: Deep Red -> Smart Orange -> Hot Yellow -> Solar White
    colorLow: 0xCC3300,
    colorMid: 0xFF9900,
    colorHigh: 0xFFFFDD,
    colorSignal: 0xFF5C00, // Fallback/Ref

    // Auto Pulse
    autoPulseEnabled: true,
    autoPulseInterval: 1200,
};

// --- TYPES ---
interface Neuron {
    id: number;
    vec: THREE.Vector3;      // Current Position (ref to Geometry attribute ideally, but object for physics easier)
    baseVec: THREE.Vector3;  // Base Position
    velocity: THREE.Vector3;
    wanderAngle: { theta: number; phi: number }; // Spherical coords for wander
    connections: number[];   // Indices of connected neurons
    flash: number;           // 0..1+ activation level (can exceed 1 for glow)
}

interface Pulse {
    active: boolean;
    fromIdx: number;
    toIdx: number;
    progress: number; // 0 to >1 (overshoot for trail)
    strength: number;
    trailIntensity: number;
    hasTriggered: boolean; // To trigger target only once
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
        // scene.fog = new THREE.FogExp2(0x000000, 0.05); // Optional depth

        const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
        camera.position.set(0, 0, 4.5);

        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0); // Explicitly clear to transparent
        containerRef.current.appendChild(renderer.domElement);

        // Trigger fade-in after a short delay
        setTimeout(() => setOpacity(1), 100);

        // --- 2. GENERATE BRAIN STRUCTURE (Full Container Fill) ---
        // The container is now masked by CSS (border-radius), so we just fill the space.

        const particleCount = 400;
        const neurons: Neuron[] = [];
        const depthRange = 0.6; // Thin depth for 2.5D look

        // Bounding box for generation - covers the view
        const genBounds = { x: 2.2, y: 1.8 }; // Adjusted to cover standard aspect ratio

        for (let i = 0; i < particleCount; i++) {
            const testP = {
                x: (Math.random() - 0.5) * 2 * genBounds.x,
                y: (Math.random() - 0.5) * 2 * genBounds.y
            };

            // Valid 2D point, add z-depth
            const z = (Math.random() - 0.5) * depthRange;

            neurons.push({
                id: neurons.length,
                vec: new THREE.Vector3(testP.x, testP.y, z),
                baseVec: new THREE.Vector3(testP.x, testP.y, z),
                velocity: new THREE.Vector3(0, 0, 0),
                wanderAngle: {
                    theta: Math.random() * Math.PI * 2,
                    phi: Math.acos(2 * Math.random() - 1)
                },
                connections: [],
                flash: 0
            });
        }

        // --- 3. CREATE CONNECTIONS ---
        const connectionPairs: { from: number; to: number; dist: number }[] = [];
        const maxConns = 4;
        const maxDistSq = CONFIG.connectionDistance * CONFIG.connectionDistance;

        for (let i = 0; i < neurons.length; i++) {
            const n1 = neurons[i];
            let connCount = 0;
            // Naive O(N^2) is fine for N=1200 once at startup
            for (let j = i + 1; j < neurons.length; j++) {
                if (connCount >= maxConns) break;
                const n2 = neurons[j];
                const dSq = n1.vec.distanceToSquared(n2.vec);

                if (dSq < maxDistSq) {
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
        const phases = new Float32Array(neurons.length); // For individual pulsating
        const flashes = new Float32Array(neurons.length); // For visual activation

        // Fill initial positions and phases
        neurons.forEach((n, i) => {
            positions[i * 3] = n.vec.x;
            positions[i * 3 + 1] = n.vec.y;
            positions[i * 3 + 2] = n.vec.z;
            phases[i] = Math.random() * Math.PI * 2;
            flashes[i] = 0.0;
        });
        particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particlesGeo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
        particlesGeo.setAttribute('aFlash', new THREE.BufferAttribute(flashes, 1));

        // Custom Shader for Pulsating Particles with Heat Gradient
        const particlesMat = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new THREE.Color(CONFIG.colorNeuron) },
                uColorLow: { value: new THREE.Color(CONFIG.colorLow) },
                uColorMid: { value: new THREE.Color(CONFIG.colorMid) },
                uColorHigh: { value: new THREE.Color(CONFIG.colorHigh) },
                uSize: { value: CONFIG.particleSize * 450 }
            },
            vertexShader: `
                uniform float uTime;
                uniform float uSize;
                attribute float aPhase;
                attribute float aFlash;
                varying float vDepth;
                varying float vFlash;
                
                void main() {
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_Position = projectionMatrix * mvPosition;
                    
                    vDepth = -mvPosition.z;
                    vFlash = aFlash;

                    // Pulsate size
                    float pulse = 1.0 + 0.3 * sin(uTime * 1.5 + aPhase);
                    
                    // Flash Growth
                    float flashGrow = smoothstep(0.0, 2.0, aFlash) * 0.8; 
                    pulse += flashGrow;
                    
                    gl_PointSize = uSize * pulse * (1.0 / vDepth);
                }
            `,
            fragmentShader: `
                uniform vec3 uColor;
                uniform vec3 uColorLow;
                uniform vec3 uColorMid;
                uniform vec3 uColorHigh;
                
                varying float vDepth;
                varying float vFlash;
                
                vec3 getHeatColor(float i) {
                    // Map intensity i (0..2+) to color gradient
                    // 0.0 - 0.5: Low -> Mid
                    // 0.5 - 1.5: Mid -> High
                    vec3 c = mix(uColorLow, uColorMid, smoothstep(0.0, 0.6, i));
                    c = mix(c, uColorHigh, smoothstep(0.6, 2.0, i));
                    return c;
                }

                void main() {
                    vec2 coord = gl_PointCoord - vec2(0.5);
                    float dist = length(coord);
                    
                    if(dist > 0.5) discard;
                    
                    // Blur Factors
                    float blurFactor = 1.0 - smoothstep(4.2, 4.9, vDepth);
                    float alphaSharp = 1.0 - smoothstep(0.4, 0.5, dist);
                    float alphaBlur = 1.0 - (dist * 2.0);
                    alphaBlur = pow(alphaBlur, 1.5);
                    
                    float finalAlpha = mix(alphaSharp, alphaBlur, blurFactor);
                    
                    // --- HEAT COLOR LOGIC ---
                    vec3 heat = getHeatColor(vFlash);
                    
                    // Mix Base -> Heat
                    float heatMix = smoothstep(0.0, 0.5, vFlash);
                    vec3 finalColor = mix(uColor, heat, heatMix);
                    
                    // Additive hot core
                    if (vFlash > 1.0 && dist < 0.2) {
                        finalColor += vec3(0.3) * (vFlash - 1.0);
                    }
                    
                    // Enhance alpha when flashing
                    finalAlpha = max(finalAlpha, finalAlpha * (1.0 + min(vFlash, 2.0)));

                    gl_FragColor = vec4(finalColor, finalAlpha * 0.85);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const particleSystem = new THREE.Points(particlesGeo, particlesMat);
        scene.add(particleSystem);


        // B. Connections (Lines)
        const linesGeo = new THREE.BufferGeometry();
        const linePositions = new Float32Array(connectionPairs.length * 2 * 3);
        const lineProgress = new Float32Array(connectionPairs.length * 2); // 0 for start, 1 for end
        const signalData = new Float32Array(connectionPairs.length * 2 * 2); // [Progress, Strength] per vertex

        // Pre-fill static attributes
        for (let i = 0; i < connectionPairs.length; i++) {
            // Vertex 0
            lineProgress[i * 2] = 0.0;
            // Vertex 1
            lineProgress[i * 2 + 1] = 1.0;
        }

        linesGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
        linesGeo.setAttribute('aLineProgress', new THREE.BufferAttribute(lineProgress, 1));
        linesGeo.setAttribute('aSignal', new THREE.BufferAttribute(signalData, 2)); // Dynamic

        const linesMat = new THREE.ShaderMaterial({
            uniforms: {
                uColorBase: { value: new THREE.Color(CONFIG.colorNeuron) },
                uColorLow: { value: new THREE.Color(CONFIG.colorLow) },
                uColorMid: { value: new THREE.Color(CONFIG.colorMid) },
                uColorHigh: { value: new THREE.Color(CONFIG.colorHigh) },
                uOpacityBase: { value: 0.06 },
            },
            vertexShader: `
                attribute float aLineProgress;
                attribute vec2 aSignal; 
                varying float vProgress;
                varying vec2 vSignal;
                
                void main() {
                    vProgress = aLineProgress;
                    vSignal = aSignal;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform vec3 uColorBase;
                uniform vec3 uColorLow;
                uniform vec3 uColorMid;
                uniform vec3 uColorHigh;
                uniform float uOpacityBase;
                
                varying float vProgress;
                varying vec2 vSignal;
                
                vec3 getHeatColor(float i) {
                     // Gradient mapping for Signal Strength
                    vec3 c = mix(uColorLow, uColorMid, smoothstep(0.0, 0.6, i));
                    c = mix(c, uColorHigh, smoothstep(0.6, 2.0, i));
                    return c;
                }

                void main() {
                    float signalProgress = vSignal.x;
                    float rawStrength = vSignal.y;
                    float signalStrength = abs(rawStrength);
                    
                    // Base appearance
                    vec3 finalColor = uColorBase;
                    float finalOpacity = uOpacityBase;
                    
                    if (signalStrength > 0.01) {
                        bool isReverse = rawStrength < 0.0;
                        float dist = isReverse ? (vProgress - signalProgress) : (signalProgress - vProgress);
                        
                        if (dist >= 0.0) {
                            float tailLen = 1.5;
                            float glow = max(0.0, 1.0 - (dist / tailLen));
                            
                            if (glow > 0.0) {
                                // Dynamic Color based on Strength
                                vec3 trailColor = getHeatColor(signalStrength);
                                
                                // Make head hotter? Not necessary if Strength is high, but let's add a slight white tip
                                // if dist is very small
                                if (dist < 0.1) {
                                     trailColor = mix(trailColor, uColorHigh, 0.5);
                                }
                                
                                // Blend
                                finalColor = mix(uColorBase, trailColor, glow);
                                finalOpacity = max(finalOpacity, glow * signalStrength);
                            }
                        }
                    }
                    
                    gl_FragColor = vec4(finalColor, finalOpacity);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const linesMesh = new THREE.LineSegments(linesGeo, linesMat);
        scene.add(linesMesh);

        // Helper Map to find line segment index in buffer by connection key
        const connectionMap = new Map<string, number>();
        connectionPairs.forEach((pair, idx) => {
            connectionMap.set(`${Math.min(pair.from, pair.to)}-${Math.max(pair.from, pair.to)}`, idx);
        });

        // --- 5. SIGNAL LOGIC ---
        const pulsePool: Pulse[] = [];
        const maxPulses = 200;
        for (let i = 0; i < maxPulses; i++) {
            pulsePool.push({ active: false, fromIdx: 0, toIdx: 0, progress: 0, strength: 0, trailIntensity: 0, hasTriggered: false });
        }

        const spawnPulse = (from: number, to: number, strength: number) => {
            const p = pulsePool.find(p => !p.active);
            if (p) {
                p.active = true;
                p.fromIdx = from;
                p.toIdx = to;
                p.progress = 0;
                p.strength = strength;
                p.trailIntensity = strength;
                p.hasTriggered = false;
            }
        };

        const triggerNeuron = () => {
            const idx = Math.floor(Math.random() * neurons.length);
            const n = neurons[idx];
            n.flash += 1.0;
            n.connections.forEach(target => spawnPulse(idx, target, 1.0));
        };

        // --- 6. ANIMATION LOOP ---
        const clock = new THREE.Clock();
        let autoPulseTimer = 0;
        const tempVec = new THREE.Vector3();

        const animate = () => {
            requestAnimationFrame(animate);
            const dt = Math.min(clock.getDelta(), 0.1);
            const time = clock.getElapsedTime();

            particlesMat.uniforms.uTime.value = time;

            const posAttr = particlesGeo.attributes.position as THREE.BufferAttribute;
            const flashAttr = particlesGeo.attributes.aFlash as THREE.BufferAttribute;
            const linePosAttr = linesGeo.attributes.position as THREE.BufferAttribute;

            // Update Neurons
            for (let i = 0; i < neurons.length; i++) {
                const n = neurons[i];

                // Wander
                n.wanderAngle.theta += (Math.random() - 0.5) * CONFIG.wanderSpeed * dt;
                n.wanderAngle.phi += (Math.random() - 0.5) * CONFIG.wanderSpeed * dt;
                const wx = Math.sin(n.wanderAngle.phi) * Math.cos(n.wanderAngle.theta);
                const wy = Math.sin(n.wanderAngle.phi) * Math.sin(n.wanderAngle.theta);
                const wz = Math.cos(n.wanderAngle.phi);
                tempVec.set(wx, wy, wz).multiplyScalar(CONFIG.wanderRadius * 0.1);
                n.velocity.add(tempVec);

                // Spring & Damping
                tempVec.copy(n.baseVec).sub(n.vec).multiplyScalar(CONFIG.springStiffness);
                n.velocity.add(tempVec);
                n.velocity.multiplyScalar(0.95);
                n.vec.addScaledVector(n.velocity, dt * 20);

                posAttr.setXYZ(i, n.vec.x, n.vec.y, n.vec.z);

                // Flash Decay
                if (n.flash > 0) {
                    n.flash = Math.max(0, n.flash - dt * 2.0);
                    n.flash = Math.min(n.flash, 4.0);
                }
                flashAttr.setX(i, n.flash);
            }
            posAttr.needsUpdate = true;
            flashAttr.needsUpdate = true;

            // Update Connection Geometry
            for (let i = 0; i < connectionPairs.length; i++) {
                const pair = connectionPairs[i];
                const n1 = neurons[pair.from];
                const n2 = neurons[pair.to];
                linePosAttr.setXYZ(i * 2, n1.vec.x, n1.vec.y, n1.vec.z);
                linePosAttr.setXYZ(i * 2 + 1, n2.vec.x, n2.vec.y, n2.vec.z);
            }
            linePosAttr.needsUpdate = true;

            // Signal Logic
            const signalAttr = linesGeo.attributes.aSignal as THREE.BufferAttribute;
            for (let i = 0; i < connectionPairs.length; i++) {
                signalAttr.setY(i * 2, 0);
                signalAttr.setY(i * 2 + 1, 0);
            }

            pulsePool.forEach(p => {
                if (!p.active) return;
                const key = `${Math.min(p.fromIdx, p.toIdx)}-${Math.max(p.fromIdx, p.toIdx)}`;
                const lineIdx = connectionMap.get(key);
                if (lineIdx === undefined) { p.active = false; return; }

                const dist = connectionPairs[lineIdx].dist;
                p.progress += (CONFIG.signalSpeed * dt) / dist;

                let shaderProgress = p.progress;
                const isReverse = p.fromIdx !== connectionPairs[lineIdx].from;
                if (isReverse) shaderProgress = 1.0 - p.progress;

                let encodedStrength = p.strength;
                if (isReverse) encodedStrength = -p.strength;

                signalAttr.setXY(lineIdx * 2, shaderProgress, encodedStrength);
                signalAttr.setXY(lineIdx * 2 + 1, shaderProgress, encodedStrength);

                // Trigger
                if (!p.hasTriggered && p.progress >= 1.0) {
                    const targetN = neurons[p.toIdx];

                    // ACCUMULATE EXACT STRENGTH (Physics Fix!)
                    targetN.flash += p.strength;

                    if (p.strength * CONFIG.signalDecay > CONFIG.minSignalStrength) {
                        targetN.connections.forEach(nextTarget => {
                            if (nextTarget !== p.fromIdx) {
                                spawnPulse(p.toIdx, nextTarget, p.strength * CONFIG.signalDecay);
                            }
                        });
                    }
                    p.hasTriggered = true;
                }

                if (p.progress > 2.5) p.active = false;
            });
            signalAttr.needsUpdate = true;

            // Auto Pulse
            if (CONFIG.autoPulseEnabled) {
                autoPulseTimer += dt * 1000;
                if (autoPulseTimer > CONFIG.autoPulseInterval) {
                    triggerNeuron();
                    autoPulseTimer = 0;
                }
            }
            renderer.render(scene, camera);
        };
        animate();

        // --- 7. RESIZE & CLEANUP ---
        // Adaptation at ResizeObserver (better than window 'resize' event)
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
            resizeObserver.disconnect();
            // if (controls) controls.dispose();
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
            className="w-full h-full transition-opacity duration-1000 ease-in-out"
            style={{ opacity: opacity }}
        />
    );
}