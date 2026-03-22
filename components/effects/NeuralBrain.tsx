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

    // Spline Connections
    curveSegments: 8, // Smoothness
    curveCurvature: 0.6, // Strength of the curve

    // Signals
    signalSpeed: 1.25,
    minSignalStrength: 0.05,
    trailDecay: 2.0,

    particleSize: 0.035, // Base size

    // Theme Colors (Standard)
    colorIdleDark: 0xE0E0E0,
    colorIdleLight: 0x444444,

    // Heat Palette for Signals (Red -> Orange -> Gold)
    colorLow: 0xCC3300,
    colorMid: 0xFF9900,
    colorHigh: 0xFFC000,

    // --- SPECIAL TYPE (5%) ---
    // Blue/Purple futuristic accent
    colorSpecialIdle: 0x5C4DFF, // Soft Electric Purple/Blue
    colorSpecialSignal: 0x00FFFF, // Cyan / Bright Blue

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
    type: number;            // 0 = Normal, 1 = Special
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
    type: number; // 0 or 1
}

export default function NeuralBrain() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [opacity, setOpacity] = useState(0);

    // Animation Refs
    const expansionRef = useRef(0);
    const requestRef = useRef<number | undefined>(undefined);
    const isVisibleRef = useRef(false);
    const lastTimeRef = useRef(0);

    // Optimization Refs
    const scrollRef = useRef(0);
    const windowMetricRef = useRef(0);
    const elementMetricRef = useRef({ top: 0, height: 0 });

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
            // Logic: 1.0 - (random^2 * strength) ensures usually small indent, occasionally deep
            // This prevents the "clean cut" look at the border.
            radius *= (1.0 - Math.random() * Math.random() * 0.35);

            const testP = {
                x: Math.cos(angle) * radius * genBounds.x,
                y: Math.sin(angle) * radius * genBounds.y
            };

            // Z is strictly 0 for physics
            const z = 0;

            // Visual Depth: 0 (Far/Sharp/Small) -> 1 (Near/Blurry/Large)
            const visualDepth = Math.random();

            // 5% Chance for Special Type
            const type = Math.random() < 0.05 ? 1 : 0;

            neurons.push({
                id: neurons.length,
                vec: new THREE.Vector3(testP.x, testP.y, z),
                baseVec: new THREE.Vector3(testP.x, testP.y, z),
                velocity: new THREE.Vector3(0, 0, 0),
                connections: [],
                flash: 0,
                visualDepth: visualDepth,
                phase: Math.random() * Math.PI * 2,
                type: type
            });
        }

        // --- 3. CREATE CONNECTIONS ---
        const connectionPairs: { from: number; to: number; dist: number; cp: THREE.Vector3 }[] = [];
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

                    // --- SPLINE CONTROL POINT ---
                    // Calculate a perpendicular offset
                    const mid = new THREE.Vector3().addVectors(n1.vec, n2.vec).multiplyScalar(0.5);
                    const dir = new THREE.Vector3().subVectors(n2.vec, n1.vec);
                    const len = dir.length();
                    // Normal in 2D (rotate 90 deg: -y, x)
                    const perp = new THREE.Vector3(-dir.y, dir.x, 0).normalize();
                    // Random curvature direction and strength
                    const curvature = (Math.random() - 0.5) * CONFIG.curveCurvature * len;
                    const cp = mid.add(perp.multiplyScalar(curvature));

                    connectionPairs.push({ from: i, to: j, dist: len, cp: cp });
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
        const types = new Float32Array(neurons.length);

        neurons.forEach((n, i) => {
            positions[i * 3] = n.vec.x;
            positions[i * 3 + 1] = n.vec.y;
            positions[i * 3 + 2] = n.vec.z;
            phases[i] = Math.random() * Math.PI * 2;
            flashes[i] = 0.0;
            visualDepths[i] = n.visualDepth;
            types[i] = n.type;
        });

        particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
        particlesGeo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
        particlesGeo.setAttribute('aFlash', new THREE.BufferAttribute(flashes, 1).setUsage(THREE.DynamicDrawUsage));
        particlesGeo.setAttribute('aVisualDepth', new THREE.BufferAttribute(visualDepths, 1));
        particlesGeo.setAttribute('aType', new THREE.BufferAttribute(types, 1));

        // Custom Shader for Depth Effect
        const particlesMat = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uExpansion: { value: 0 }, // 0 = Collapsed, 1 = Full
                uColorIdle: { value: new THREE.Color(CONFIG.colorIdleDark) },
                uColorLow: { value: new THREE.Color(CONFIG.colorLow) },
                uColorMid: { value: new THREE.Color(CONFIG.colorMid) },
                uColorHigh: { value: new THREE.Color(CONFIG.colorHigh) },

                uColorSpecialIdle: { value: new THREE.Color(CONFIG.colorSpecialIdle) },
                uColorSpecialSignal: { value: new THREE.Color(CONFIG.colorSpecialSignal) },

                uSize: { value: CONFIG.particleSize * 450 }
            },
            vertexShader: `
                uniform float uTime;
                uniform float uSize;
                uniform float uExpansion;
                attribute float aPhase;
                attribute float aFlash;
                attribute float aVisualDepth; // 0..1
                attribute float aType; // 0 or 1
                
                varying float vFlash;
                varying float vPhase;
                varying float vVisualDepth;
                varying float vType;
                
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
                    vType = aType;

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

                uniform vec3 uColorSpecialIdle;
                uniform vec3 uColorSpecialSignal;
                
                varying float vFlash;
                varying float vPhase;
                varying float vVisualDepth;
                varying float vType;
                
                vec3 getHeatColor(float i) {
                    // Normal
                    vec3 c = mix(uColorLow, uColorMid, smoothstep(0.0, 0.6, i));
                    c = mix(c, uColorHigh, smoothstep(0.6, 2.0, i));

                    // Special Overwrite
                    if (vType > 0.5) {
                        // Mix from special idle to special high
                        c = mix(uColorSpecialIdle, uColorSpecialSignal, smoothstep(0.0, 1.5, i));
                    }

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
                    
                    vec3 baseIdle = (vType > 0.5) ? uColorSpecialIdle : uColorIdle;
                    // Boost idle brightness for special type to make them visible
                    if (vType > 0.5) baseIdle *= 1.5; 
                    
                    vec3 idleState = mix(baseIdle, baseIdle * 1.2, breath * 0.3);
                    
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


        // B. Connections (Splines)
        const segments = CONFIG.curveSegments;
        const totalVertices = connectionPairs.length * segments * 2;

        const linesGeo = new THREE.BufferGeometry();
        const linePositions = new Float32Array(totalVertices * 3);
        const lineProgress = new Float32Array(totalVertices);
        // Changed aSignal to vec3: x=progress, y=strength, z=type
        const signalData = new Float32Array(totalVertices * 3);
        const distData = new Float32Array(totalVertices);
        const linePhases = new Float32Array(totalVertices);

        for (let i = 0; i < connectionPairs.length; i++) {
            const pair = connectionPairs[i];
            const n1 = neurons[pair.from];
            const n2 = neurons[pair.to];
            const cp = pair.cp;

            // Approximate Curve Length (sum of chords)
            let curveLen = 0;
            const points: THREE.Vector3[] = [];

            // Generate Points inclusive (0 to segments) -> segments + 1 points
            for (let s = 0; s <= segments; s++) {
                const t = s / segments;
                // Quadratic Bezier
                const invT = 1 - t;
                const p = new THREE.Vector3();
                p.x = invT * invT * n1.vec.x + 2 * invT * t * cp.x + t * t * n2.vec.x;
                p.y = invT * invT * n1.vec.y + 2 * invT * t * cp.y + t * t * n2.vec.y;
                p.z = 0;
                points.push(p);

                if (s > 0) {
                    curveLen += points[s].distanceTo(points[s - 1]);
                }
            }

            // Fill Buffers (segments lines)
            const baseIdx = i * segments * 2; // vertex index in buffer (not float index)

            for (let s = 0; s < segments; s++) {
                const pStart = points[s];
                const pEnd = points[s + 1];
                const tStart = s / segments;
                const tEnd = (s + 1) / segments;

                // Vertex 1
                const v1 = (baseIdx + s * 2);
                linePositions[v1 * 3] = pStart.x;
                linePositions[v1 * 3 + 1] = pStart.y;
                linePositions[v1 * 3 + 2] = pStart.z;

                lineProgress[v1] = tStart;
                distData[v1] = curveLen;
                linePhases[v1] = n1.phase;

                // Vertex 2
                const v2 = (baseIdx + s * 2 + 1);
                linePositions[v2 * 3] = pEnd.x;
                linePositions[v2 * 3 + 1] = pEnd.y;
                linePositions[v2 * 3 + 2] = pEnd.z;

                lineProgress[v2] = tEnd;
                distData[v2] = curveLen;
                linePhases[v2] = n2.phase; // Or n1? Phase dictates wander... use mixing? Just stick to n1 for consistency across line.
                // Actually if I use n1.phase for whole line, the whole line wanders together.
                // If I use mixed phase, it might stretch weirdly.
                // Let's use n1.phase for consistency.
                linePhases[v2] = n1.phase;
            }

            // Update pair dist to curve length for accurate speed calc
            pair.dist = curveLen;
        }

        linesGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3).setUsage(THREE.DynamicDrawUsage));
        linesGeo.setAttribute('aLineProgress', new THREE.BufferAttribute(lineProgress, 1));
        linesGeo.setAttribute('aSignal', new THREE.BufferAttribute(signalData, 3).setUsage(THREE.DynamicDrawUsage)); // Changed to 3
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

                uColorSpecialSignal: { value: new THREE.Color(CONFIG.colorSpecialSignal) },

                uOpacityBase: { value: 0.08 },
            },
            transparent: true,
            vertexShader: `
                uniform float uTime;
                uniform float uExpansion;
                attribute float aLineProgress;
                attribute vec3 aSignal; // x=prog, y=str, z=type
                attribute float aDist;
                attribute float aPhase; // Phase of the attached neuron
                
                varying float vProgress;
                varying vec3 vSignal;
                varying float vDist;
                
                void main() {
                    vProgress = aLineProgress;
                    vSignal = aSignal;
                    vDist = aDist;

                    // Wander Logic (Match Particles)
                    // Use aPhase to keep the line attached to the neuron visually
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
                uniform vec3 uColorSpecialSignal;
                
                uniform float uOpacityBase;
                
                varying float vProgress;
                varying vec3 vSignal; // x=prog, y=str, z=type
                varying float vDist;
                
                vec3 getHeatColor(float i, float type) {
                    if (type > 0.5) {
                        return uColorSpecialSignal;
                    }
                    vec3 c = mix(uColorMid, uColorHigh, smoothstep(0.0, 1.0, i));
                    return c;
                }

                void main() {
                    float signalProgress = vSignal.x;
                    float rawStrength = vSignal.y;
                    float signalType = vSignal.z;

                    float signalStrength = abs(rawStrength);
                    
                    vec3 finalColor = uColorIdle;
                    float finalOpacity = uOpacityBase;
                    
                    if (signalStrength > 0.01) {
                        bool isReverse = rawStrength < 0.0;
                        float distUV = isReverse ? (vProgress - signalProgress) : (signalProgress - vProgress);
                        
                        float distWorld = distUV * vDist;

                        if (distWorld >= 0.0) {
                            float tailLen = 0.8; // Reduced tail length for clearer pulse
                            float glow = max(0.0, 1.0 - (distWorld / tailLen));
                            
                            if (glow > 0.0) {
                                vec3 trailColor = getHeatColor(signalStrength, signalType);
                                trailColor *= 2.0;

                                if (distWorld < 0.05) {
                                    // Flash head
                                    vec3 flashColor = (signalType > 0.5) ? uColorSpecialSignal : uColorHigh;
                                    trailColor = mix(trailColor, flashColor, 0.6);
                                }
                                
                                finalColor = mix(finalColor, trailColor, glow);
                                // Double the opacity multiplier (6.0 -> 12.0) to make trails visible even at low strength
                                finalOpacity = max(finalOpacity, glow * signalStrength * 12.0);
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
        const maxPulses = 8000;
        // Optimization: Free Stack (O(1) allocation) & Active List (O(N_active) iteration)
        const freePulseIndices: number[] = [];
        const activePulseIndices: number[] = [];

        for (let i = 0; i < maxPulses; i++) {
            pulsePool.push({ active: false, fromIdx: 0, toIdx: 0, progress: 0, strength: 0, trailIntensity: 0, hasTriggered: false, lineIdx: -1, type: 0 });
            freePulseIndices.push(i);
        }

        const dirtyLines: number[] = [];

        const spawnPulse = (from: number, to: number, strength: number, startProgress = 0.0, type: number) => {
            const key = `${Math.min(from, to)}-${Math.max(from, to)}`;
            const lineIdx = connectionMap.get(key);
            if (lineIdx === undefined) return;

            if (freePulseIndices.length > 0) {
                const pIdx = freePulseIndices.pop()!;
                const p = pulsePool[pIdx];

                p.active = true;
                p.fromIdx = from;
                p.toIdx = to;
                p.progress = startProgress;
                p.strength = strength;
                p.trailIntensity = strength;
                p.hasTriggered = false;
                p.lineIdx = lineIdx;
                p.type = type; // Pass Type

                activePulseIndices.push(pIdx);
            }
        };

        const triggerNeuron = () => {
            const idx = Math.floor(Math.random() * neurons.length);
            const n = neurons[idx];
            n.flash += 2.0;

            // Randomize outputs: Don't fire all connections. 
            // Fire 1 to N connections (random subset) to avoid "starburst" uniformity.
            // This makes some signals weak (single line) and others strong (burst).
            const targetCount = 1 + Math.floor(Math.random() * n.connections.length);
            // Simple shuffle or pick random
            // Since maxConnections is small (6), just iterating and skipping random is fine.
            let fired = 0;
            for (let i = 0; i < n.connections.length; i++) {
                if (fired >= targetCount) break;
                // Randomized chance to pick this connection, or force if we run out of time
                if (Math.random() < 0.5 || (n.connections.length - i) <= (targetCount - fired)) {
                    // Propagate type!
                    spawnPulse(idx, n.connections[i], 3.0, 0.0, n.type);
                    fired++;
                }
            }
        };

        // --- 6. ANIMATION LOOP ---
        const clock = new THREE.Clock();

        const animate = (time: number) => {
            // Keep reference for loop
            requestRef.current = requestAnimationFrame(animate);

            // Time Delta
            const dt = Math.min((time - lastTimeRef.current) / 1000, 0.1);
            lastTimeRef.current = time;

            if (!containerRef.current) return;

            // --- SCROLL-DRIVEN EXPANSION (OPTIMIZED) ---
            // Use cached values to avoid layout thrashing
            const { top, height } = elementMetricRef.current;
            const scrollY = scrollRef.current;
            const viewH = windowMetricRef.current;

            const elementCenter = (top - scrollY) + height / 2;
            const viewCenter = viewH / 2;
            const dist = Math.abs(elementCenter - viewCenter);

            // UPDATED LOGIC: "Plateau" behavior
            const safeZone = viewH * 0.35;
            const fadeEnd = viewH * 0.55;

            let targetExpansion = 0.0;

            if (dist <= safeZone) {
                targetExpansion = 1.0;
            } else {
                const fadeProgress = Math.max(0, Math.min(1, (dist - safeZone) / (fadeEnd - safeZone)));
                const smoothFade = fadeProgress * fadeProgress * (3 - 2 * fadeProgress);
                targetExpansion = 1.0 - smoothFade;
            }

            // If observer says Hidden, force 0 (Optimization safety)
            if (!isVisibleRef.current) targetExpansion = 0.0;

            const currentExp = expansionRef.current;

            // Smooth Lerp (Responsive but smooth)
            const newExp = currentExp + (targetExpansion - currentExp) * 0.1;
            expansionRef.current = newExp;

            // Apply Uniforms
            particlesMat.uniforms.uExpansion.value = newExp;
            linesMat.uniforms.uExpansion.value = newExp;

            // --- STOP OPTIMIZATION ---
            if (!isVisibleRef.current && newExp < 0.001) {
                if (requestRef.current) {
                    cancelAnimationFrame(requestRef.current);
                    requestRef.current = undefined;
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
                    n.flash = Math.max(0, n.flash - dt * 2.0); // Faster decay to reduce "busy" look
                    n.flash = Math.min(n.flash, 4.0);
                }
                flashArray[i] = n.flash;
            }
            (particlesGeo.attributes.aFlash as THREE.BufferAttribute).needsUpdate = true;

            // Signal Logic
            const signalAttr = linesGeo.attributes.aSignal as THREE.BufferAttribute;
            const signalArray = signalAttr.array as Float32Array;
            const segments = CONFIG.curveSegments;

            // Auto Pulse (Random / Organic)
            if (CONFIG.autoPulseEnabled) {
                for (let k = 0; k < 3; k++) {
                    if (Math.random() < 0.25) {
                        triggerNeuron();
                    }
                }
            }

            // Clean previous dirty signals
            dirtyLines.forEach(lineIdx => {
                const base = lineIdx * segments * 2 * 3;
                // Loop over all vertices of the spline
                for (let k = 0; k < segments * 2; k++) {
                    const idx = base + k * 3;
                    signalArray[idx] = 0;
                    signalArray[idx + 1] = 0;
                    signalArray[idx + 2] = 0;
                }
            });
            dirtyLines.length = 0;

            // Optimization: Iterate ONLY active pulses
            for (let i = activePulseIndices.length - 1; i >= 0; i--) {
                const pIdx = activePulseIndices[i];
                const p = pulsePool[pIdx];

                const lineIdx = p.lineIdx;
                const dist = connectionPairs[lineIdx].dist;
                p.progress += (CONFIG.signalSpeed * dt) / dist;

                let shaderProgress = p.progress;
                const isReverse = p.fromIdx !== connectionPairs[lineIdx].from;
                if (isReverse) shaderProgress = 1.0 - p.progress;

                let encodedStrength = p.strength;

                // --- VISUAL DECAY DURING TRAVEL ---
                const travelDecay = Math.exp(-dist * p.progress * 2.0);
                const currentStrength = p.strength * travelDecay;

                if (isReverse) encodedStrength = -currentStrength;
                else encodedStrength = currentStrength;

                // UPDATE FOR VEC3 SIGNAL (Spline)
                const base = lineIdx * segments * 2 * 3;

                // Set uniform signal value for the entire curve
                // The shader uses aLineProgress to determine local effect
                for (let k = 0; k < segments * 2; k++) {
                    const idx = base + k * 3;
                    signalArray[idx] = shaderProgress;
                    signalArray[idx + 1] = encodedStrength;
                    signalArray[idx + 2] = p.type;
                }

                dirtyLines.push(lineIdx);

                if (!p.hasTriggered && p.progress >= 1.0) {
                    const targetN = neurons[p.toIdx];
                    targetN.flash += currentStrength;

                    if (currentStrength > CONFIG.minSignalStrength) {
                        targetN.connections.forEach(mateIdx => {
                            if (mateIdx !== p.fromIdx) {
                                spawnPulse(p.toIdx, mateIdx, currentStrength, 0.0, targetN.type);
                            }
                        });
                    }
                    p.hasTriggered = true;
                }

                if (p.progress >= 1.0 + (CONFIG.trailDecay / dist)) {
                    p.active = false;
                    freePulseIndices.push(pIdx);
                    const activeLen = activePulseIndices.length;
                    const lastActive = activePulseIndices[activeLen - 1];
                    activePulseIndices[i] = lastActive;
                    activePulseIndices.pop();
                }
            }

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
        }, { threshold: 0.1, rootMargin: '-20% 0px' });

        intersectionObserver.observe(containerRef.current);

        // --- 7. RESIZE & SCROLL HANDLERS (OPTIMIZED) ---
        const updateMetrics = () => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            // Store absolute top position (current scroll + rect.top)
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            elementMetricRef.current = {
                top: rect.top + scrollTop,
                height: rect.height
            };
            windowMetricRef.current = window.innerHeight;

            // Update renderer size
            const newW = containerRef.current.clientWidth;
            const newH = containerRef.current.clientHeight;
            camera.aspect = newW / newH;
            camera.updateProjectionMatrix();
            renderer.setSize(newW, newH);
        };

        const handleScroll = () => {
            scrollRef.current = window.scrollY || document.documentElement.scrollTop;
        };

        // Initial setup
        updateMetrics();
        handleScroll();

        window.addEventListener("resize", updateMetrics);
        window.addEventListener("scroll", handleScroll, { passive: true });

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            observer.disconnect();
            intersectionObserver.disconnect();
            window.removeEventListener("resize", updateMetrics);
            window.removeEventListener("scroll", handleScroll);

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
        />
    );
}