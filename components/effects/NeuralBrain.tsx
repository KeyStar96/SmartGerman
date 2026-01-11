"use client";

import { useRef, useEffect, useState } from "react";
import * as THREE from "three";


// --- CONFIG ---
const CONFIG = {
    neuronDensity: 4,
    connectionDistance: 0.35,
    minConnectionDistance: 0.15,
    wanderRadius: 0.025,
    wanderSpeed: 0.01,
    springStiffness: 0.04,
    maxConnections: 6,

    // Signals
    signalSpeed: 1.25,
    minSignalStrength: 0.05,
    trailDecay: 2.0, // Seconds until trail is gone

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
};

// --- TYPES ---
interface Neuron {
    id: number;
    vec: THREE.Vector3;      // Position (Z will be 0)
    baseVec: THREE.Vector3;  // Base Position
    connections: number[];
    visualDepth: number;     // 0 (Back) to 1 (Front)
    phase: number;
    lastFlash: number;       // Timestamp of last flash
}

interface Pulse {
    active: boolean;
    fromIdx: number;
    toIdx: number;
    startTime: number;
    arrivalTime: number; // calculated startTime + dist/speed
    strength: number;
    lineIdx: number;
    dist: number;
}

export default function NeuralBrain() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [opacity, setOpacity] = useState(0);

    // Animation Refs
    const expansionRef = useRef(0);
    const requestRef = useRef<number | undefined>(undefined);
    const isVisibleRef = useRef(false);
    const lastTimeRef = useRef(0);

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
            // Elliptical Generation for organic shape
            const angle = Math.random() * Math.PI * 2;
            let radius = Math.sqrt(Math.random()); // Sqrt for uniform distribution
            // Coastline/Erosion effect: Randomly pull back particles to break the hard edge
            radius *= (1.0 - Math.random() * Math.random() * 0.35);

            const testP = {
                x: Math.cos(angle) * radius * genBounds.x,
                y: Math.sin(angle) * radius * genBounds.y
            };

            // Z is strictly 0 for physics
            const z = 0;

            // Visual Depth: 0 (Far/Sharp/Small) -> 1 (Near/Blurry/Large)
            const visualDepth = Math.random();

            neurons.push({
                id: neurons.length,
                vec: new THREE.Vector3(testP.x, testP.y, z),
                baseVec: new THREE.Vector3(testP.x, testP.y, z),
                connections: [],
                visualDepth: visualDepth,
                phase: Math.random() * Math.PI * 2,
                lastFlash: -100.0 // Never flashed
            });
        }

        // --- 3. CREATE CONNECTIONS ---
        const connectionPairs: { from: number; to: number; dist: number }[] = [];
        const maxDistSq = CONFIG.connectionDistance * CONFIG.connectionDistance;
        const minDistSq = CONFIG.minConnectionDistance * CONFIG.minConnectionDistance;

        for (let i = 0; i < neurons.length; i++) {
            const n1 = neurons[i];
            let connCount = 0;
            // Iterate through potential partners. 
            // Hybrid approach: Prefer local, allow some random global.
            for (let j = i + 1; j < neurons.length; j++) {
                if (connCount >= CONFIG.maxConnections) break;
                const n2 = neurons[j];

                // 2D Distance Check (Z is ignored as it is 0)
                const dSq = n1.vec.distanceToSquared(n2.vec);

                // Logic: Connect if CLOSE (structure) OR RARELY if FAR (long-range axons)
                // 0.2% chance for a long-distance connection per candidate
                const isLocal = dSq < maxDistSq;
                const isGlobal = Math.random() < 0.002;

                if ((isLocal || isGlobal) && dSq > minDistSq) {
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
        const flashTimes = new Float32Array(neurons.length);
        const visualDepths = new Float32Array(neurons.length);

        neurons.forEach((n, i) => {
            positions[i * 3] = n.vec.x;
            positions[i * 3 + 1] = n.vec.y;
            positions[i * 3 + 2] = n.vec.z;
            phases[i] = Math.random() * Math.PI * 2;
            flashTimes[i] = -100.0; // Init as 'long ago'
            visualDepths[i] = n.visualDepth;
        });

        particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
        particlesGeo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
        particlesGeo.setAttribute('aFlashTime', new THREE.BufferAttribute(flashTimes, 1).setUsage(THREE.DynamicDrawUsage));
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
                attribute float aFlashTime;
                attribute float aVisualDepth; // 0..1
                
                varying float vFlash;
                varying float vPhase;
                varying float vVisualDepth;
                
                void main() {
                    // Wander Logic (GPU)
                    vec3 offset = vec3(
                        sin(uTime * 0.5 + aPhase), 
                        cos(uTime * 0.4 + aPhase * 0.9), 
                        0.0
                    ) * 0.04;

                    vec3 finalPos = (position + offset) * uExpansion;
                    vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
                    gl_Position = projectionMatrix * mvPosition;
                    
                    // Calc flash intensity based on time elapsed since trigger
                    float timeSinceFlash = uTime - aFlashTime;
                    
                    // Decay logic: Starts at 4.0, decays to 0.0 quickly
                    // Using similar decay to JS version: 2.0 speed
                    float decay = max(0.0, 4.0 - timeSinceFlash * 2.5);
                    vFlash = decay;

                    vPhase = aPhase;
                    vVisualDepth = aVisualDepth;

                    // Pulsate
                    float breath = 0.1 * sin(uTime * 1.5 + aPhase); 
                    float flashGrow = smoothstep(0.0, 2.0, vFlash) * 1.0; 
                    float pulse = 1.0 + breath + flashGrow;
                    
                    // Depth Scale
                    float depthScale = 0.5 + aVisualDepth * 1.0;

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
                    
                    float edgeInner = mix(0.40, 0.0, vVisualDepth);
                    float alpha = 1.0 - smoothstep(edgeInner, 0.5, dist);
                    
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

        // Signal Data now holds: [TargetTime (Time when signal started), Strength]
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
            // Direction 1 -> 0.0 (Source)
            lineProgress[i * 2] = 0.0;
            distData[i * 2] = pair.dist;
            linePhases[i * 2] = n1.phase;
            // Init signal: Start time very negative (expired)
            signalData[i * 4] = -999.0;
            signalData[i * 4 + 1] = 0.0;

            // Direction 2 -> 1.0 (Target)
            lineProgress[i * 2 + 1] = 1.0;
            distData[i * 2 + 1] = pair.dist;
            linePhases[i * 2 + 1] = n2.phase;
            signalData[i * 4 + 2] = -999.0;
            signalData[i * 4 + 3] = 0.0;
        }

        linesGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3).setUsage(THREE.DynamicDrawUsage));
        linesGeo.setAttribute('aLineProgress', new THREE.BufferAttribute(lineProgress, 1));
        linesGeo.setAttribute('aSignal', new THREE.BufferAttribute(signalData, 2).setUsage(THREE.DynamicDrawUsage));
        linesGeo.setAttribute('aDist', new THREE.BufferAttribute(distData, 1));
        linesGeo.setAttribute('aPhase', new THREE.BufferAttribute(linePhases, 1));

        const linesMat = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uExpansion: { value: 0 },
                uColorIdle: { value: new THREE.Color(CONFIG.colorIdleDark) },
                uColorLow: { value: new THREE.Color(CONFIG.colorLow) },
                uColorMid: { value: new THREE.Color(CONFIG.colorMid) },
                uColorHigh: { value: new THREE.Color(CONFIG.colorHigh) },
                uOpacityBase: { value: 0.15 }, // slightly increased base
                uSignalSpeed: { value: CONFIG.signalSpeed },
            },
            transparent: true,
            vertexShader: `
                uniform float uTime;
                uniform float uExpansion;
                attribute float aLineProgress;
                attribute vec2 aSignal; // x = StartTime, y = Strength
                attribute float aDist;
                attribute float aPhase;
                
                varying float vLineProgress;
                varying vec2 vSignal; // x = StartTime, y = Strength
                varying float vDist;
                
                void main() {
                    vLineProgress = aLineProgress;
                    vSignal = aSignal;
                    vDist = aDist;

                    // Wander (Match Particles)
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
                uniform vec3 uColorMid;
                uniform vec3 uColorHigh;
                uniform float uOpacityBase;
                uniform float uSignalSpeed;
                uniform float uTime;
                
                varying float vLineProgress;
                varying vec2 vSignal;
                varying float vDist;
                
                vec3 getHeatColor(float i) {
                    vec3 c = mix(uColorMid, uColorHigh, smoothstep(0.0, 1.0, i));
                    return c;
                }

                void main() {
                    float startTime = vSignal.x;
                    float rawStrength = vSignal.y;
                    
                    float elapsedTime = uTime - startTime;
                    float signalStrength = abs(rawStrength);

                    vec3 finalColor = uColorIdle;
                    float finalOpacity = uOpacityBase;

                    // If signal is active (elapsedTime >= 0)
                    if (signalStrength > 0.01 && elapsedTime >= 0.0) {
                        float distTravelled = elapsedTime * uSignalSpeed;
                        float currentProgress = distTravelled / vDist;
                        
                        // Check if we are within valid range (including trail)
                        // Trail Length in UV space = trailLen / vDist
                        float trailLen = 0.8; 
                        
                        // Direction Handling
                        bool isReverse = rawStrength < 0.0;
                        
                        // Map currentProgress to UV space [0..1]
                        float signalUV = isReverse ? (1.0 - currentProgress) : currentProgress;
                        
                        // Calculate distance from this fragment to the signal head in World Space
                        // Frag is at vLineProgress
                        // Signal Head is at signalUV
                        
                        // signed distance along line (positive = signal passed us)
                        float distFromHead = isReverse 
                            ? (vLineProgress - signalUV) * vDist 
                            : (signalUV - vLineProgress) * vDist;

                        // Trail logic: Signal is at Head. Tail is behind.
                        // distFromHead should be >= 0 (signal passed) and <= tailLen
                        if (distFromHead >= 0.0 && distFromHead <= trailLen) {
                             float glow = 1.0 - (distFromHead / trailLen);
                             // Cubic falloff for smoother trail
                             glow = glow * glow; 

                             // Decay intensity over distance travelled
                             float travelDecay = exp(-distTravelled * 1.5);
                             float currentIntensity = signalStrength * travelDecay;
                             
                             vec3 trailColor = getHeatColor(currentIntensity);
                             trailColor *= 2.0; // Boost brightness

                             // White hot tip
                             if (distFromHead < 0.05) {
                                  trailColor = mix(trailColor, uColorHigh, 0.6);
                             }
                             
                             finalColor = mix(finalColor, trailColor, glow);
                             finalOpacity = max(finalOpacity, glow * currentIntensity * 12.0);
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

        // --- THEME ---
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

        // --- 5. LOGIC ENGINE (EVENTS) ---
        // Instead of per-frame updates, we calculate events.

        const activePulses: Pulse[] = [];
        // Buffers for updating GPU attributes sparsely
        const signalUpdateQueue = new Set<number>(); // line indices that need updates
        const neuronUpdateQueue = new Set<number>(); // neuron indices that need updates

        const spawnPulse = (from: number, to: number, strength: number, time: number) => {
            const key = `${Math.min(from, to)}-${Math.max(from, to)}`;
            const lineIdx = connectionMap.get(key);
            if (lineIdx === undefined) return;

            const pair = connectionPairs[lineIdx];
            const dist = pair.dist;
            const duration = dist / CONFIG.signalSpeed;

            // Logic Object
            const p: Pulse = {
                active: true,
                fromIdx: from,
                toIdx: to,
                startTime: time,
                arrivalTime: time + duration,
                strength: strength,
                lineIdx: lineIdx,
                dist: dist
            };
            activePulses.push(p);

            // GPU Update
            // 1. Calculate encoded strength (Negative if Reverse direction)
            const isReverse = from !== pair.from;
            const encodedStrength = isReverse ? -strength : strength;

            // 2. Update Attribute for this line
            const vIndex = lineIdx * 4;
            // Write to local array (Reference)
            // Note: We use the existing buffers.
            signalData[vIndex] = time;
            signalData[vIndex + 1] = encodedStrength;
            signalData[vIndex + 2] = time;
            signalData[vIndex + 3] = encodedStrength;

            // 3. Mark for upload
            signalUpdateQueue.add(lineIdx);
        };

        const triggerNeuron = (neuronIdx: number, time: number, incomingStrength: number) => {
            const n = neurons[neuronIdx];

            // update logic
            n.lastFlash = time;

            // GPU Update
            flashTimes[neuronIdx] = time;
            neuronUpdateQueue.add(neuronIdx);

            // Trigger Connections
            // Logic: Random subset to properly disperse
            const targetCount = 1 + Math.floor(Math.random() * n.connections.length);

            let fired = 0;
            // Shuffle/Random pick optimization:
            // Start at random offset
            const startOff = Math.floor(Math.random() * n.connections.length);

            for (let i = 0; i < n.connections.length; i++) {
                if (fired >= targetCount) break;
                const idx = (startOff + i) % n.connections.length;

                // Allow back-prop mostly, but maybe not immediately to sender? 
                // Simplified: Just trigger.

                // Strength Decay
                // Ensure we don't have infinite loops of max strength
                // Slightly decay the strength passed on.
                const outStrength = Math.max(CONFIG.minSignalStrength, incomingStrength * 0.9);

                spawnPulse(neuronIdx, n.connections[idx], outStrength, time);
                fired++;
            }
        };


        // --- 6. ANIMATION LOOP ---
        const animate = (timeMS: number) => {
            requestRef.current = requestAnimationFrame(animate);

            // Convert to seconds
            const time = timeMS * 0.001;
            const dt = (time - lastTimeRef.current); // Seconds

            // --- SCROLL / EXPANSION LOGIC ---
            // (Same as before)
            let targetExpansion = 0.0;
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const viewH = window.innerHeight;
                const dist = Math.abs((rect.top + rect.height / 2) - (viewH / 2));
                const maxDist = viewH * 0.6;
                const normDist = Math.max(0, Math.min(1, dist / maxDist));
                targetExpansion = 1.0 - (normDist * normDist * (3 - 2 * normDist));
            }
            if (!isVisibleRef.current) targetExpansion = 0.0;

            const currentExp = expansionRef.current;
            const newExp = currentExp + (targetExpansion - currentExp) * 0.1;
            expansionRef.current = newExp;

            particlesMat.uniforms.uExpansion.value = newExp;
            linesMat.uniforms.uExpansion.value = newExp;

            // Stop rendering content if hidden/collapsed (Optimization)
            if (!isVisibleRef.current && newExp < 0.001) {
                lastTimeRef.current = time; // Keep time sync
                return;
            }

            // Update Uniforms
            particlesMat.uniforms.uTime.value = time;
            linesMat.uniforms.uTime.value = time;

            // --- GAME LOOP LOGIC ---

            // 1. Process Active Pulses
            // Check for arrivals
            for (let i = activePulses.length - 1; i >= 0; i--) {
                const p = activePulses[i];
                if (time >= p.arrivalTime) {
                    // Arrived!
                    triggerNeuron(p.toIdx, time, p.strength);

                    // Remove from active list
                    // Swap-Pop
                    activePulses[i] = activePulses[activePulses.length - 1];
                    activePulses.pop();
                }
            }

            // 2. Auto Pulse (Random Triggers)4
            if (CONFIG.autoPulseEnabled) {
                // Determine how many to fire. 
                // Adjusted for 120Hz/60Hz invariance: Probability per second.
                // Target: ~45 pulses/sec
                const pulsesToSpawn = 45 * dt;
                // Integer part
                let count = Math.floor(pulsesToSpawn);
                // Float remainder chance
                if (Math.random() < (pulsesToSpawn - count)) count++;

                // Cap to avoid explosion on lag spike
                count = Math.min(count, 10);

                for (let k = 0; k < count; k++) {
                    const idx = Math.floor(Math.random() * neurons.length);
                    // Start new chain with high strength
                    triggerNeuron(idx, time, 4.0);
                }
            }

            // --- BATCH UPDATES TO GPU ---

            // Update Lines
            if (signalUpdateQueue.size > 0) {
                const signalAttr = linesGeo.attributes.aSignal as THREE.BufferAttribute;

                // Optimization: If too many, update all. If few, update ranges.
                // "Too many" heuristic: > 20% of buffer?
                // Actually, three.js `updateRange` is a single contiguous block. 
                // If we have sparse updates (idx 0 and idx 1000), single range covers 0..1000.
                // So effectively, full update might be cheaper/same if scattered.
                // BUT: We usually only have 1-5 new pulses per frame.
                // The `signalData` array is already up to date (we wrote to it in spawnPulse).
                // We just need to tell GL to re-upload.

                // In simple 120Hz opt: Just set needsUpdate=true.
                // Uploading float32array of ~8000 (32KB) is INSTANT.
                // The slowdown before was JS loop calculating 8000 items.
                signalAttr.needsUpdate = true;
                signalUpdateQueue.clear();
            }

            // Update Neurons
            if (neuronUpdateQueue.size > 0) {
                const flashAttr = particlesGeo.attributes.aFlashTime as THREE.BufferAttribute;
                flashAttr.needsUpdate = true;
                neuronUpdateQueue.clear();
            }

            lastTimeRef.current = time;
            renderer.render(scene, camera);
        };

        // Start Loop
        const startLoop = () => {
            if (!requestRef.current) {
                lastTimeRef.current = performance.now() * 0.001;
                animate(performance.now());
            }
        };

        // Observers
        const intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                isVisibleRef.current = entry.isIntersecting;
                if (entry.isIntersecting) startLoop();
            });
        }, { threshold: 0.1 });
        intersectionObserver.observe(containerRef.current);

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
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            observer.disconnect();
            resizeObserver.disconnect();
            intersectionObserver.disconnect();
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