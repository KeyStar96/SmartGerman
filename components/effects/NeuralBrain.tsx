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

        // Kamera etwas näher ran, damit das Detail wirkt
        const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
        camera.position.z = 4.5;

        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Performance Optimierung
        containerRef.current.appendChild(renderer.domElement);

        const brainGroup = new THREE.Group();
        scene.add(brainGroup);

        // --- 2. HILFSFUNKTION: DIE GEHIRN-WINDUNGEN ---
        // Diese Funktion verformt eine perfekte Kugel zu etwas Organischem
        const deformGeometry = (geometry: THREE.BufferGeometry) => {
            const positionAttribute = geometry.attributes.position;
            const vertex = new THREE.Vector3();

            // Wir gehen jeden Punkt der Kugel durch
            for (let i = 0; i < positionAttribute.count; i++) {
                vertex.fromBufferAttribute(positionAttribute, i);

                // Math-Magie: Wir überlagern verschiedene Sinus-Wellen, um "Rauschen" zu erzeugen
                // Das simuliert die unebene Struktur (Gyri/Sulci)
                const noise =
                    Math.sin(vertex.x * 4.5) * 0.15 +
                    Math.sin(vertex.y * 4.5) * 0.15 +
                    Math.sin(vertex.z * 4.5) * 0.15 +
                    Math.sin(vertex.x * 10 + vertex.y * 5) * 0.05; // Feinere Details

                // Wir verschieben den Punkt basierend auf dem Noise nach außen/innen
                const normalize = vertex.clone().normalize();
                vertex.add(normalize.multiplyScalar(noise));

                positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
            }

            // Wichtig: Three.js sagen, dass sich die Form geändert hat
            geometry.computeVertexNormals();
            positionAttribute.needsUpdate = true;
        };

        // --- 3. ERSTELLUNG DER HEMISPHÄREN ---

        // Material: Technisch, Orange, Wireframe
        const shellMaterial = new THREE.MeshPhongMaterial({
            color: 0xFF5C00, // SmartGerman Orange
            emissive: 0x220a00, // Leichtes Selbstleuchten für Tiefe
            wireframe: true,
            transparent: true,
            opacity: 0.15, // Etwas sichtbarer als vorher
            shininess: 80,
            side: THREE.DoubleSide
        });

        const createHemisphere = (isLeft: boolean) => {
            // Hohe Segment-Zahl (64, 64) ist wichtig für schöne Windungen!
            const geometry = new THREE.SphereGeometry(1, 84, 84);

            // 1. Erst verformen wir die Kugel organisch
            deformGeometry(geometry);

            // 2. Dann skalieren wir sie in die Gehirn-Form (Länglich, unten flacher)
            geometry.scale(0.85, 1.1, 1.2);

            const mesh = new THREE.Mesh(geometry, shellMaterial);

            // 3. Positionierung und leichte Drehung für den Spalt
            mesh.position.x = isLeft ? -0.55 : 0.55;

            // Die Hälften leicht zueinander neigen (anatomisch korrekter)
            mesh.rotation.z = isLeft ? 0.1 : -0.1;

            return mesh;
        };

        const leftHemi = createHemisphere(true);
        const rightHemi = createHemisphere(false);

        brainGroup.add(leftHemi);
        brainGroup.add(rightHemi);

        // --- 4. INNENLEBEN: NEURONEN (PARTIKEL) ---
        // Damit es nicht leer wirkt, füllen wir es mit "Gedanken"
        const particlesGeometry = new THREE.BufferGeometry();
        const particlesCount = 800;
        const posArray = new Float32Array(particlesCount * 3);

        for (let i = 0; i < particlesCount * 3; i++) {
            // Zufällige Punkte im Raum (grob innerhalb des Gehirns)
            posArray[i] = (Math.random() - 0.5) * 2.5;
        }

        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.02,
            color: 0xFF5C00,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });

        // Wir skalieren die Punktwolke passend zum Gehirn
        const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
        particlesMesh.scale.set(0.8, 1, 1);
        brainGroup.add(particlesMesh);

        // --- 5. LICHT & SZENE ---
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
        directionalLight.position.set(2, 5, 5);
        scene.add(directionalLight);
        scene.add(new THREE.AmbientLight(0xffffff, 0.2));

        // --- 6. ANIMATION LOOP ---
        let mouseX = 0;
        let mouseY = 0;
        const windowHalfX = window.innerWidth / 2;
        const windowHalfY = window.innerHeight / 2;

        const handleMouseMove = (event: MouseEvent) => {
            mouseX = (event.clientX - windowHalfX) * 0.001;
            mouseY = (event.clientY - windowHalfY) * 0.001;
        };

        document.addEventListener('mousemove', handleMouseMove);

        const animate = () => {
            requestAnimationFrame(animate);

            // Permanente langsame Rotation
            brainGroup.rotation.y += 0.002;

            // Interaktion: Smooth Easing zur Mausposition
            brainGroup.rotation.y += (mouseX - brainGroup.rotation.y * 0.1) * 0.5;
            brainGroup.rotation.x += (-mouseY - brainGroup.rotation.x * 0.1) * 0.5;

            // Pulsieren der Neuronen
            const time = Date.now() * 0.002;
            particlesMesh.rotation.y = -time * 0.1; // Neuronen drehen sich innen leicht anders

            // Leichtes "Atmen" des Gehirns
            const scale = 1 + Math.sin(time) * 0.01;
            brainGroup.scale.set(scale, scale, scale);

            renderer.render(scene, camera);
        };

        animate();

        // --- 7. CLEANUP ---
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
            document.removeEventListener("mousemove", handleMouseMove);
            if (containerRef.current && renderer.domElement) {
                containerRef.current.removeChild(renderer.domElement);
            }
            // Speicher freigeben
            leftHemi.geometry.dispose();
            rightHemi.geometry.dispose();
            shellMaterial.dispose();
            particlesGeometry.dispose();
            particlesMaterial.dispose();
            renderer.dispose();
        };
    }, []);

    return <div ref={containerRef} className="w-full h-full" />;
}