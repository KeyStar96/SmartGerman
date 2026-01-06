"use client";

import { useRef, useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export default function NeuralBrain() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // --- 1. SETUP ---
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        const scene = new THREE.Scene();
        // Slight fog for depth
        scene.fog = new THREE.FogExp2(0x000000, 0.08);

        const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
        camera.position.set(0, 0, 4.5);

        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: true
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        containerRef.current.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enableZoom = false; // Disable zoom to keep layout intact
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.5;

        // --- 2. PROCEDURAL BRAIN GENERATION ---

        // Internal helper to check if a point is inside an ellipsoid
        const isInsideEllipsoid = (p: THREE.Vector3, center: THREE.Vector3, radius: THREE.Vector3) => {
            // (x-cx)^2/rx^2 + (y-cy)^2/ry^2 + (z-cz)^2/rz^2 <= 1
            const dx = (p.x - center.x) / radius.x;
            const dy = (p.y - center.y) / radius.y;
            const dz = (p.z - center.z) / radius.z;
            return (dx * dx + dy * dy + dz * dz) <= 1;
        };

        // Brain Anatomy Volumes (Approximations)
        // Adjust these numbers until the silhouette looks right
        const brainVolumes = [
            // Left Hemisphere Main
            { center: new THREE.Vector3(-0.4, 0.1, 0), radius: new THREE.Vector3(0.5, 0.65, 0.8) },
            // Right Hemisphere Main
            { center: new THREE.Vector3(0.4, 0.1, 0), radius: new THREE.Vector3(0.5, 0.65, 0.8) },
            // Left Temporal Lobe (Side/Bottom)
            { center: new THREE.Vector3(-0.5, -0.2, 0.2), radius: new THREE.Vector3(0.3, 0.3, 0.5) },
            // Right Temporal Lobe
            { center: new THREE.Vector3(0.5, -0.2, 0.2), radius: new THREE.Vector3(0.3, 0.3, 0.5) },
            // Cerebellum (Back/Bottom) two small bulbs
            { center: new THREE.Vector3(-0.2, -0.5, -0.4), radius: new THREE.Vector3(0.25, 0.25, 0.3) },
            { center: new THREE.Vector3(0.2, -0.5, -0.4), radius: new THREE.Vector3(0.25, 0.25, 0.3) },
            // Frontal bump adjustment
            { center: new THREE.Vector3(0, 0.2, 0.5), radius: new THREE.Vector3(0.6, 0.5, 0.35) },
        ];

        const particleCount = 1400; // Increased density for better shape definition
        const positions: number[] = [];
        const validPoints: THREE.Vector3[] = [];

        // Generate Neurons
        let attempts = 0;
        while (validPoints.length < particleCount && attempts < 50000) {
            attempts++;
            // Random point in bounding box
            const p = new THREE.Vector3(
                (Math.random() - 0.5) * 2.2,
                (Math.random() - 0.5) * 1.8,
                (Math.random() - 0.5) * 2.0
            );

            // Check if inside ANY brain volume
            let inside = false;
            for (const vol of brainVolumes) {
                if (isInsideEllipsoid(p, vol.center, vol.radius)) {
                    inside = true;
                    break;
                }
            }

            if (inside) {
                // Determine color based on depth or random variation
                validPoints.push(p);
                positions.push(p.x, p.y, p.z);
            }
        }

        // --- 3. CREATE GEOMETRY ---
        // A. Neurons (Points)
        const particlesGeometry = new THREE.BufferGeometry();
        particlesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

        const particlesMaterial = new THREE.PointsMaterial({
            color: 0x00E0FF, // Cyan/Blueish for sci-fi look (matches ref image 2/3) - base
            size: 0.035,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const particleSystem = new THREE.Points(particlesGeometry, particlesMaterial);
        scene.add(particleSystem);

        // B. Synapses (Connections)
        // We connect points that are close to each other
        const synapsePositions: number[] = [];
        const maxDistance = 0.25;
        const maxConnectionsPerNeuron = 4; // Optimization

        for (let i = 0; i < validPoints.length; i++) {
            const p1 = validPoints[i];
            let connections = 0;

            // Look at other points (simplified loop for performance)
            // Ideally use an octree, but for 1400 points O(N^2) is acceptable if optimized
            for (let j = i + 1; j < validPoints.length; j++) {
                if (connections >= maxConnectionsPerNeuron) break;

                const p2 = validPoints[j];
                const distSq = p1.distanceToSquared(p2);

                if (distSq < maxDistance * maxDistance) {
                    synapsePositions.push(p1.x, p1.y, p1.z);
                    synapsePositions.push(p2.x, p2.y, p2.z);
                    connections++;
                }
            }
        }

        const synapsesGeometry = new THREE.BufferGeometry();
        synapsesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(synapsePositions, 3));

        const synapsesMaterial = new THREE.LineBasicMaterial({
            color: 0x4a9aff, // Blue-ish connections
            transparent: true,
            opacity: 0.15,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const synapsesLines = new THREE.LineSegments(synapsesGeometry, synapsesMaterial);
        scene.add(synapsesLines);

        // --- 4. DATA PULSES (OPTIONAL GLOW ACCENTS) ---
        // Create a few larger glowing "active" nodes
        const activeNodesGeometry = new THREE.BufferGeometry();
        const activeCount = 15;
        const activeData: number[] = [];
        for (let i = 0; i < activeCount; i++) {
            // Pick rand existing point
            const idx = Math.floor(Math.random() * validPoints.length);
            const p = validPoints[idx];
            activeData.push(p.x, p.y, p.z);
        }
        activeNodesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(activeData, 3));

        const activeMaterial = new THREE.PointsMaterial({
            color: 0xFFFFFF,
            size: 0.1,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const activeNodes = new THREE.Points(activeNodesGeometry, activeMaterial);
        scene.add(activeNodes);


        // --- 5. ANIMATION LOOP ---
        const clock = new THREE.Clock();

        const animate = () => {
            requestAnimationFrame(animate);
            const time = clock.getElapsedTime();

            controls.update(); // handles auto-rotation

            // Gentle floating/breathing
            const breathe = 1 + Math.sin(time * 0.8) * 0.02;
            particleSystem.scale.set(breathe, breathe, breathe);
            synapsesLines.scale.set(breathe, breathe, breathe);
            activeNodes.scale.set(breathe, breathe, breathe);

            // Pulse effect for active nodes
            activeMaterial.opacity = 0.5 + Math.sin(time * 3) * 0.4;
            activeMaterial.size = 0.08 + Math.sin(time * 3) * 0.03;

            // Slowly rotate Active Nodes differently to create dynamic feel
            // Actually, better to just update their positions to jump to new neurons periodically?
            // For now, let them stick to the brain structure.

            renderer.render(scene, camera);
        };
        animate();

        // --- 6. CLEANUP ---
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
            particlesGeometry.dispose();
            particlesMaterial.dispose();
            synapsesGeometry.dispose();
            synapsesMaterial.dispose();
            activeNodesGeometry.dispose();
            activeMaterial.dispose();
            renderer.dispose();
        };
    }, []);

    return <div ref={containerRef} className="w-full h-full cursor-move" />;
}