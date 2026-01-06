"use client";

import { useRef, useEffect, useState } from "react";
import * as THREE from "three";


// --- CONFIG ---
const CONFIG = {
    neuronDensity: 0.0004,
    connectionDistance: 1.2,
    wanderRadius: 0.35,       // Increased for visible movement
    wanderSpeed: 0.6,        // Faster movement
    springStiffness: 0.04,

    // Signals
    signalSpeed: 1.25, // Slower (Half of 2.5)
    signalDecay: 0.7,
    minSignalStrength: 0.1,
    trailDecay: 2.0,

    particleSize: 0.035,
    colorNeuron: 0xFFFFFF,
    colorSignal: 0xFF5C00,
    colorHigh: 0xFF9900, // Yellow-Orange boost

    // Auto Pulse
    autoPulseEnabled: true,
    autoPulseInterval: 2000,
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

        // Custom Shader for Pulsating Particles with DoF and Flash
        const particlesMat = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new THREE.Color(CONFIG.colorNeuron) },
                uColorSignal: { value: new THREE.Color(CONFIG.colorSignal) },
                uColorHigh: { value: new THREE.Color(CONFIG.colorHigh) },
                uSize: { value: CONFIG.particleSize * 450 } // Slightly increased base scale
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
                    
                    // Pass depth to fragment (positive view Z distance)
                    vDepth = -mvPosition.z;
                    vFlash = aFlash;

                    // Pulsate size: organic sine wave
                    // Flash increases size significantly
                    float pulse = 1.0 + 0.3 * sin(uTime * 1.5 + aPhase);
                    
                    // Flash Growth: Logarithmic or capped to prevent explosion
                    float flashGrow = smoothstep(0.0, 3.0, aFlash) * 1.0; 
                    pulse += flashGrow;
                    
                    // Std size attenuation
                    gl_PointSize = uSize * pulse * (1.0 / vDepth);
                }
            `,
            fragmentShader: `
                uniform vec3 uColor;
                uniform vec3 uColorSignal;
                uniform vec3 uColorHigh;
                varying float vDepth;
                varying float vFlash;
                
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
                    
                    // --- COLOR LOGIC (Additive Glow) ---
                    // 1. Determine base glowing color (Signal vs High)
                    vec3 glowColor = uColorSignal;
                    if (vFlash > 1.0) {
                        // Mix towards yellow/white if very intense
                        glowColor = mix(uColorSignal, uColorHigh, smoothstep(1.0, 2.5, vFlash));
                    }
                    
                    // 2. Mix Base Neuron with Glow Color
                    // Intensity ramps up quickly from 0 to 1
                    float signalMix = smoothstep(0.0, 1.0, vFlash);
                    vec3 finalColor = mix(uColor, glowColor, signalMix);
                    
                    // 3. Additive Bloom override
                    // If Really hot (>1.5), we add extra brightness to the center
                    if (vFlash > 1.5 && dist < 0.2) {
                        finalColor += vec3(0.2, 0.2, 0.2) * (vFlash - 1.5);
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
                uColorSignal: { value: new THREE.Color(CONFIG.colorSignal) },
                uColorHigh: { value: new THREE.Color(CONFIG.colorHigh) },
                uOpacityBase: { value: 0.06 }, // Subtle base connection
            },
            vertexShader: `
                attribute float aLineProgress;
                attribute vec2 aSignal; // x = Progress (0..1), y = Strength (0..1)
                
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
                uniform vec3 uColorSignal;
                uniform vec3 uColorHigh;
                uniform float uOpacityBase;
                
                varying float vProgress;
                varying vec2 vSignal;
                
                void main() {
                    float signalProgress = vSignal.x;
                    float rawStrength = vSignal.y;
                    float signalStrength = abs(rawStrength);
                    
                    // Base appearance
                    vec3 finalColor = uColorBase;
                    float finalOpacity = uOpacityBase;
                    
                    // Signal Trail Logic
                    if (signalStrength > 0.01) {
                        bool isReverse = rawStrength < 0.0;
                        
                        // Calculate distance from head based on direction
                        float dist = isReverse ? (vProgress - signalProgress) : (signalProgress - vProgress);
                        
                        // EXTENDED TRAIL: dist >= 0.0 check ensures we don't draw ahead of signal
                        if (dist >= 0.0) {
                            // Long tail fade
                            // Brightness = 1.0 at head (dist=0)
                            // Fades to 0 at dist=1.5 (very long tail)
                            float tailLen = 1.5;
                            float glow = max(0.0, 1.0 - (dist / tailLen));
                            
                            if (glow > 0.0) {
                                // Hot Head Effect:
                                // If close to head (dist < 0.15), mix towards High Color
                                vec3 trailColor = uColorSignal;
                                if (dist < 0.15) {
                                    float headHeat = 1.0 - (dist / 0.15);
                                    trailColor = mix(uColorSignal, uColorHigh, headHeat);
                                }
                                
                                // Apply additive glow
                                // Use max to prevent base line opacity from overriding bright tails
                                finalColor = mix(uColorBase, trailColor, glow * signalStrength);
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
        const connectionMap = new Map<string, number>(); // "min-max" -> index in connectionPairs
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
                p.trailIntensity = strength; // Start full strength
                p.hasTriggered = false;
            }
        };

        const triggerNeuron = () => {
            const idx = Math.floor(Math.random() * neurons.length);
            const n = neurons[idx];
            n.flash += 1.0; // Accumulate intensity!
            // Fire to all neighbors
            n.connections.forEach(target => spawnPulse(idx, target, 1.0));
        };

        // --- 6. ANIMATION LOOP ---
        const clock = new THREE.Clock();
        let autoPulseTimer = 0;

        // Reusable objects to avoid GC
        const tempVec = new THREE.Vector3();

        const animate = () => {
            requestAnimationFrame(animate);
            const dt = Math.min(clock.getDelta(), 0.1); // Cap dt
            const time = clock.getElapsedTime();

            // Shader Pulsation Update
            particlesMat.uniforms.uTime.value = time;

            // controls.update(); // Removed controls

            // A. PHYSICS UPDATE (Wander & Spring)
            const posAttr = particlesGeo.attributes.position as THREE.BufferAttribute;
            const flashAttr = particlesGeo.attributes.aFlash as THREE.BufferAttribute;
            const linePosAttr = linesGeo.attributes.position as THREE.BufferAttribute;

            for (let i = 0; i < neurons.length; i++) {
                const n = neurons[i];

                // 1. Wander force
                n.wanderAngle.theta += (Math.random() - 0.5) * CONFIG.wanderSpeed * dt;
                n.wanderAngle.phi += (Math.random() - 0.5) * CONFIG.wanderSpeed * dt;

                // Sphere to Cartesian
                const wx = Math.sin(n.wanderAngle.phi) * Math.cos(n.wanderAngle.theta);
                const wy = Math.sin(n.wanderAngle.phi) * Math.sin(n.wanderAngle.theta);
                const wz = Math.cos(n.wanderAngle.phi);

                tempVec.set(wx, wy, wz).multiplyScalar(CONFIG.wanderRadius * 0.1); // Force magnitude

                n.velocity.add(tempVec);

                // 2. Spring force (return to base)
                tempVec.copy(n.baseVec).sub(n.vec).multiplyScalar(CONFIG.springStiffness);
                n.velocity.add(tempVec);

                // 3. Damping
                n.velocity.multiplyScalar(0.95);

                // 4. Apply
                n.vec.addScaledVector(n.velocity, dt * 20); // Scale time for effect

                // Update Buffer
                posAttr.setXYZ(i, n.vec.x, n.vec.y, n.vec.z);

                // Flash Decay
                if (n.flash > 0) {
                    n.flash = Math.max(0, n.flash - dt * 2.0); // Decay speed slightly slower for glow check
                    // Cap max accumulated flash
                    n.flash = Math.min(n.flash, 4.0);
                }
                flashAttr.setX(i, n.flash);
            }
            posAttr.needsUpdate = true;
            flashAttr.needsUpdate = true;

            // B. UPDATE CONNECTIONS GEOMETRY
            // Needs to move with neurons
            for (let i = 0; i < connectionPairs.length; i++) {
                const pair = connectionPairs[i];
                const n1 = neurons[pair.from];
                const n2 = neurons[pair.to];

                // Line start
                linePosAttr.setXYZ(i * 2, n1.vec.x, n1.vec.y, n1.vec.z);
                // Line end
                linePosAttr.setXYZ(i * 2 + 1, n2.vec.x, n2.vec.y, n2.vec.z);
            }
            linePosAttr.needsUpdate = true;


            // C. SIGNAL PROPAGATION & ATTRIBUTE UPDATE
            // 1. Clear Signal Buffer for this frame (reset to 0)
            const signalAttr = linesGeo.attributes.aSignal as THREE.BufferAttribute;
            // Ideally we'd conceptually "fade" but since our shader draws the trail based on ONE position, 
            // we just need to update that position. 
            // Limitation: One pulse per line max for now visually. (Last one wins)

            // To ensure lines don't "flicker" off if no pulse, we just set them to 0 strength.
            // Efficient clear:
            for (let i = 0; i < connectionPairs.length; i++) {
                // Set Strength (y) to 0
                signalAttr.setY(i * 2, 0);
                signalAttr.setY(i * 2 + 1, 0);
            }

            // Update Pulses
            pulsePool.forEach(p => {
                if (!p.active) return;

                // Dist
                const key = `${Math.min(p.fromIdx, p.toIdx)}-${Math.max(p.fromIdx, p.toIdx)}`;
                const lineIdx = connectionMap.get(key);

                if (lineIdx === undefined) {
                    p.active = false;
                    return;
                }

                // Move Progress
                const dist = connectionPairs[lineIdx].dist;
                p.progress += (CONFIG.signalSpeed * dt) / dist;

                // Update Attribute
                // Determine direction matching the lineProgress (0->1)
                // connectionPairs[lineIdx] is stored as {from, to}
                // lineProgress is 0 at vertex 0 (which corresponds to 'from'?)
                // Yes, linePosAttr setXYZ(i*2) uses connectionPairs[i].from.

                // If p.fromIdx == connectionPairs[lineIdx].from, then pulse is moving 0 -> 1.
                // If p.fromIdx != connectionPairs[lineIdx].from, then pulse is moving 1 -> 0.

                let shaderProgress = p.progress;
                const isReverse = p.fromIdx !== connectionPairs[lineIdx].from;
                if (isReverse) {
                    shaderProgress = 1.0 - p.progress;
                }

                // Write to BOTH vertices of the line
                // But wait, the shader needs ONE progress value relative to the line direction?
                // Our shader compares vProgress (0..1) with vSignal.x (Signal Position).
                // If pulse is moving 0->1, Signal Pos increases. Trail is (pos - 0.3) to pos.
                // If pulse is moving 1->0 (Reverse):
                // We define shaderProgress as the current location 1.0 -> 0.0.
                // But calculation: dist = signalProgress - vProgress.
                // If signal is at 0.8 (moving down), trail should be "behind" it (0.8 to 1.1?).
                // No, "Behind" logically means where it came from.
                // If moving 1->0, it came from 1. So trail is [0.8, 1.0].
                // Math: dist = vProgress - signalProgress?
                // Visual Symmetry: 
                // Let's stick to valid range: |vProgress - signalProgress| < 0.3 ?
                // No, direction matters.

                // UNIVERSAL SHADER LOGIC attempt:
                // Pass "Direction" to shader? Or handle mathematically.
                // Let's Keep It Simple:
                // We ALWAYS pass the signal position as 0..1 relative to the line geometry.
                // If moving 0->1: Draw trail where vProgress < SignalPos.
                // If moving 1->0: Draw trail where vProgress > SignalPos.
                // This requires sending direction or encoding it.
                // Hack: Pass Signal Strength as NEGATIVE if reverse? 

                let encodedStrength = p.strength;
                if (isReverse) encodedStrength = -p.strength;

                signalAttr.setXY(lineIdx * 2, shaderProgress, encodedStrength);
                signalAttr.setXY(lineIdx * 2 + 1, shaderProgress, encodedStrength);

                // CHECK TRIGGER (Target Reached)
                if (!p.hasTriggered && p.progress >= 1.0) {
                    // Flash the target neuron (Accumulate!)
                    const targetN = neurons[p.toIdx];
                    targetN.flash += 1.0;

                    if (p.strength * CONFIG.signalDecay > CONFIG.minSignalStrength) {
                        targetN.connections.forEach(nextTarget => {
                            if (nextTarget !== p.fromIdx) {
                                spawnPulse(p.toIdx, nextTarget, p.strength * CONFIG.signalDecay);
                            }
                        });
                    }
                    p.hasTriggered = true;
                }

                // CHECK DEATH (Trail fully faded)
                // If trailLen = 1.5, we kill it when progress > 1.0 + 1.5 = 2.5
                if (p.progress > 2.5) {
                    p.active = false;
                }
            });

            signalAttr.needsUpdate = true;

            // D. INTERACTION / AUTO PULSE
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