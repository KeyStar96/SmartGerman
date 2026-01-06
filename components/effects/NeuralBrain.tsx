"use client";

import { useRef, useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// --- CONFIG ---
const CONFIG = {
    neuronDensity: 0.0004,
    connectionDistance: 1.2, // Adapted for 3D scale (approx. similar relative distance)
    wanderRadius: 0.1,       // 3D scale
    wanderSpeed: 0.5,        // Speed of wandering
    springStiffness: 0.04,

    // Signals
    signalSpeed: 2.5,        // Units per second
    signalDecay: 0.7,        // Retain 70% intensity on hop
    minSignalStrength: 0.1,
    trailDecay: 2.0,         // Trail fades out speed

    particleSize: 0.035, // Base size
    colorNeuron: 0xFFFFFF,   // White structure (ScienceSection compatible)
    colorSignal: 0xFF5C00,   // Orange signal (ScienceSection compatible)

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
}

interface Pulse {
    active: boolean;
    fromIdx: number;
    toIdx: number;
    progress: number; // 0 to 1
    strength: number;
    trailIntensity: number; // For visual fade
}

export default function NeuralBrain() {
    const containerRef = useRef<HTMLDivElement>(null);

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
        containerRef.current.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enableZoom = false;
        controls.autoRotate = false; // Disabled to keep alignment with head mask
        controls.minPolarAngle = Math.PI / 2 - 0.2; // Restrict vertical movement
        controls.maxPolarAngle = Math.PI / 2 + 0.2;
        controls.minAzimuthAngle = -0.2; // Restrict horizontal movement slightly
        controls.maxAzimuthAngle = 0.2;

        // --- 2. GENERATE BRAIN STRUCTURE ---
        // Adjusted for Side Profile (Left Facing Head -> Visual Right Cavity)
        // Since container is mirrored, Visual Right = Negative X in Three.js ?
        // Let's stick to centering it and moving the camera or using offset.
        // Actually, we can just shape it to look like a brain profile.

        const brainOffset = new THREE.Vector3(-0.35, 0.15, 0); // Shift to match image cavity

        const brainVolumes = [
            // Main Cerebrum (Upper mass)
            { center: new THREE.Vector3(0, 0.15, 0).add(brainOffset), radius: new THREE.Vector3(0.65, 0.55, 0.5) },
            // Frontal Lobe (Forward/Top)
            { center: new THREE.Vector3(-0.4, 0.1, 0).add(brainOffset), radius: new THREE.Vector3(0.4, 0.35, 0.45) },
            // Occipital (Back)
            { center: new THREE.Vector3(0.4, 0.0, 0).add(brainOffset), radius: new THREE.Vector3(0.4, 0.4, 0.45) },
            // Temporal (Lower Side)
            { center: new THREE.Vector3(0.1, -0.25, 0).add(brainOffset), radius: new THREE.Vector3(0.45, 0.3, 0.45) },
            // Cerebellum (Back Bottom Tucked)
            { center: new THREE.Vector3(0.3, -0.45, 0).add(brainOffset), radius: new THREE.Vector3(0.3, 0.25, 0.25) },
            // Brainstem connection
            { center: new THREE.Vector3(0.1, -0.5, 0).add(brainOffset), radius: new THREE.Vector3(0.15, 0.3, 0.15) },
        ];

        const isInsideEllipsoid = (p: THREE.Vector3, center: THREE.Vector3, radius: THREE.Vector3) => {
            const dx = (p.x - center.x) / radius.x;
            const dy = (p.y - center.y) / radius.y;
            const dz = (p.z - center.z) / radius.z;
            return (dx * dx + dy * dy + dz * dz) <= 1;
        };

        const particleCount = 1200; // Target count
        const neurons: Neuron[] = [];

        let attempts = 0;
        while (neurons.length < particleCount && attempts < 50000) {
            attempts++;
            const p = new THREE.Vector3(
                (Math.random() - 0.5) * 2.2,
                (Math.random() - 0.5) * 1.8,
                (Math.random() - 0.5) * 2.0
            );

            let inside = false;
            for (const vol of brainVolumes) {
                if (isInsideEllipsoid(p, vol.center, vol.radius)) {
                    inside = true;
                    break;
                }
            }

            if (inside) {
                neurons.push({
                    id: neurons.length,
                    vec: p.clone(),
                    baseVec: p.clone(),
                    velocity: new THREE.Vector3(0, 0, 0),
                    wanderAngle: {
                        theta: Math.random() * Math.PI * 2,
                        phi: Math.acos(2 * Math.random() - 1)
                    },
                    connections: []
                });
            }
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
        // Fill initial positions
        neurons.forEach((n, i) => {
            positions[i * 3] = n.vec.x;
            positions[i * 3 + 1] = n.vec.y;
            positions[i * 3 + 2] = n.vec.z;
        });
        particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const particlesMat = new THREE.PointsMaterial({
            color: CONFIG.colorNeuron,
            size: CONFIG.particleSize,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const particleSystem = new THREE.Points(particlesGeo, particlesMat);
        scene.add(particleSystem);


        // B. Connections (Lines)
        const linesGeo = new THREE.BufferGeometry();
        const linePositions = new Float32Array(connectionPairs.length * 2 * 3);
        const lineColors = new Float32Array(connectionPairs.length * 2 * 3); // RGB per vertex

        // Pre-fill colors (start with low opacity white/cyan)
        const baseColor = new THREE.Color(CONFIG.colorNeuron);
        for (let i = 0; i < lineColors.length; i += 3) {
            lineColors[i] = baseColor.r;
            lineColors[i + 1] = baseColor.g;
            lineColors[i + 2] = baseColor.b;
        }

        linesGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
        linesGeo.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

        const linesMat = new THREE.LineBasicMaterial({
            vertexColors: true,     // CRITICAL for signal effect
            transparent: true,
            opacity: 0.15,           // Base opacity
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
            pulsePool.push({ active: false, fromIdx: 0, toIdx: 0, progress: 0, strength: 0, trailIntensity: 0 });
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
            }
        };

        const triggerNeuron = () => {
            const idx = Math.floor(Math.random() * neurons.length);
            const n = neurons[idx];
            // Fire to all neighbors
            n.connections.forEach(target => spawnPulse(idx, target, 1.0));
        };

        // --- 6. ANIMATION LOOP ---
        const clock = new THREE.Clock();
        let autoPulseTimer = 0;

        // Reusable objects to avoid GC
        const tempVec = new THREE.Vector3();
        const signalColorObj = new THREE.Color(CONFIG.colorSignal);
        const baseColorObj = new THREE.Color(CONFIG.colorNeuron);

        const animate = () => {
            requestAnimationFrame(animate);
            const dt = Math.min(clock.getDelta(), 0.1); // Cap dt
            const time = clock.getElapsedTime();

            controls.update();

            // A. PHYSICS UPDATE (Wander & Spring)
            const posAttr = particlesGeo.attributes.position as THREE.BufferAttribute;
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
            }
            posAttr.needsUpdate = true;

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


            // C. SIGNAL PROPAGATION & COLORING
            // Reset colors slightly towards base (decay trail) or fully reset? 
            // Better: We must reset all colors every frame to base, then apply active pulses.
            // But for "Trail" decay, we need state. 
            // Simplified approach: calculated purely on pulses.

            // First, reset all line colors to base dim state? 
            // Efficiency warning: Looping 2400 lines * 2 vertices = 4800 updates per frame. acceptable.

            // Optimization: Create an array of "intensity" per line.
            // Decay intensity array, then update color buffer.

            if (!linesMesh.userData.intensities) {
                linesMesh.userData.intensities = new Float32Array(connectionPairs.length).fill(0);
            }
            const intensities = linesMesh.userData.intensities as Float32Array;

            // Decay intensities
            for (let i = 0; i < intensities.length; i++) {
                if (intensities[i] > 0) {
                    intensities[i] -= CONFIG.trailDecay * dt;
                    if (intensities[i] < 0) intensities[i] = 0;
                }
            }

            // Update Pulses
            pulsePool.forEach(p => {
                if (!p.active) return;

                // Move progress
                // dist of this specific connection
                const key = `${Math.min(p.fromIdx, p.toIdx)}-${Math.max(p.fromIdx, p.toIdx)}`;
                const lineIdx = connectionMap.get(key);

                if (lineIdx === undefined) {
                    p.active = false; // Should not happen
                    return;
                }

                const dist = connectionPairs[lineIdx].dist;
                p.progress += (CONFIG.signalSpeed * dt) / dist;

                // Update intensity of the line it is traversing
                // We just max out intensity for visual "flash" when passing?
                // Or drawn a "point" moving? 
                // Requirement: "Update vertex colors... light trail"
                // Easiest is to light up the whole segment based on progress or just set it high and let decay handle it.
                // Let's set high intensity while active.

                // Make the line glow based on position? 
                // LineSegments doesn't support gradient along the line easily without custom shader.
                // We will light up the WHOLE segment for now as it's a LineSegment (2 verts).

                intensities[lineIdx] = Math.max(intensities[lineIdx], p.strength);

                if (p.progress >= 1.0) {
                    p.active = false;
                    // Trigger neighbors?
                    if (p.strength * CONFIG.signalDecay > CONFIG.minSignalStrength) {
                        const targetN = neurons[p.toIdx];
                        targetN.connections.forEach(nextTarget => {
                            if (nextTarget !== p.fromIdx) { // Don't bounce back immediately
                                spawnPulse(p.toIdx, nextTarget, p.strength * CONFIG.signalDecay);
                            }
                        });
                    }
                }
            });

            // Update Color Buffer based on Intensities
            const colorAttr = linesGeo.attributes.color as THREE.BufferAttribute;
            for (let i = 0; i < connectionPairs.length; i++) {
                const intensity = intensities[i];
                // Interp between baseColor and signalColor

                // Color = Base + (Signal - Base) * intensity
                // Clamped
                const r = baseColorObj.r + (signalColorObj.r - baseColorObj.r) * Math.min(intensity, 1);
                const g = baseColorObj.g + (signalColorObj.g - baseColorObj.g) * Math.min(intensity, 1);
                const b = baseColorObj.b + (signalColorObj.b - baseColorObj.b) * Math.min(intensity, 1);

                // Set both vertices of the segment
                colorAttr.setXYZ(i * 2, r, g, b);
                colorAttr.setXYZ(i * 2 + 1, r, g, b);
            }
            colorAttr.needsUpdate = true;


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
        const handleResize = () => {
            if (!containerRef.current) return;
            const newW = containerRef.current.clientWidth;
            const newH = containerRef.current.clientHeight;
            camera.aspect = newW / newH;
            camera.updateProjectionMatrix();
            renderer.setSize(newW, newH);
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            if (controls) controls.dispose();
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

    return <div ref={containerRef} className="w-full h-full cursor-not-allowed pointer-events-none" />;
}