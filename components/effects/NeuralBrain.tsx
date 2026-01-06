"use client";

import { useRef, useEffect } from "react";
import * as THREE from "three";

export default function NeuralBrain() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // --- 1. SETUP ---
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        camera.position.z = 3.5;

        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true // Wichtig für den transparenten Hintergrund
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio);
        containerRef.current.appendChild(renderer.domElement);

        // --- 2. DAS GEHIRN-MODELL (DIE HÜLLE) ---
        const brainGroup = new THREE.Group();

        // Material für die Hülle: Wissenschaftlich-Transparent
        const shellMaterial = new THREE.MeshPhongMaterial({
            color: 0xFF5C00, // Dein Brand-Orange
            transparent: true,
            opacity: 0.1,
            wireframe: true, // Erzeugt den technischen Look
            shininess: 100,
        });

        // Funktion zum Erstellen einer Hemisphäre
        const createHemisphere = (isLeft: boolean) => {
            const geometry = new THREE.SphereGeometry(1, 32, 32);

            // Die Kugel mathematisch zu einer Gehirnhälfte verformen (Ellipsoid)
            geometry.scale(0.8, 1.2, 1);

            const mesh = new THREE.Mesh(geometry, shellMaterial);
            mesh.position.x = isLeft ? -0.45 : 0.45; // Abstand zwischen den Hälften
            return mesh;
        };

        const leftHemi = createHemisphere(true);
        const rightHemi = createHemisphere(false);

        brainGroup.add(leftHemi);
        brainGroup.add(rightHemi);
        scene.add(brainGroup);

        // --- 3. BELEUCHTUNG ---
        const mainLight = new THREE.DirectionalLight(0xffffff, 1);
        mainLight.position.set(5, 5, 5);
        scene.add(mainLight);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        // --- 4. ANIMATION & ROTATION ---
        let mouseX = 0;
        let mouseY = 0;

        const handleMouseMove = (event: MouseEvent) => {
            // Normierte Mauskoordinaten (-1 bis 1)
            mouseX = (event.clientX / window.innerWidth) * 2 - 1;
            mouseY = (event.clientY / window.innerHeight) * 2 - 1;
        };

        window.addEventListener("mousemove", handleMouseMove);

        const animate = () => {
            requestAnimationFrame(animate);

            // Permanente langsame Rotation
            brainGroup.rotation.y += 0.005;

            // Subtile Reaktion auf Mausbewegung
            brainGroup.rotation.x += (mouseY * 0.2 - brainGroup.rotation.x) * 0.05;
            brainGroup.rotation.y += (mouseX * 0.2 - brainGroup.rotation.y) * 0.05;

            renderer.render(scene, camera);
        };

        animate();

        // --- 5. CLEANUP & RESIZE ---
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
            window.removeEventListener("mousemove", handleMouseMove);
            if (containerRef.current) {
                containerRef.current.removeChild(renderer.domElement);
            }
            renderer.dispose();
        };
    }, []);

    return <div ref={containerRef} className="w-full h-full" />;
}