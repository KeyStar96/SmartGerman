"use client";

import { useRef, useEffect, useMemo } from "react";

interface Point {
    x: number;
    y: number;
    z: number;
    origX: number;
    origY: number;
    origZ: number;
    opacity: number;
    size: number;
    brightness: number;
}

export default function NeuralBrain() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouseRef = useRef({ x: 0, y: 0, active: false });

    // Brain parameters
    const pointCount = 1200;
    const brainSize = 180;
    const rotationSpeed = 0.005;

    const points = useMemo(() => {
        const pts: Point[] = [];
        for (let i = 0; i < pointCount; i++) {
            // Spherical coordinates
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            // Ellipsoid factors (human brain shape is roughly 1.0, 1.2, 0.9)
            const a = 1.0; // Left-Right
            const b = 1.2; // Front-Back
            const c = 0.9; // Top-Bottom

            // Gyri (Windungen) simulation using sine waves
            const gyrusAmplitude = 0.08;
            const gyrusFreq = 10;
            const distortion = 1 + Math.sin(theta * gyrusFreq) * Math.sin(phi * gyrusFreq) * gyrusAmplitude;

            // Two hemispheres gap
            let xPos = Math.sin(phi) * Math.cos(theta) * a * distortion;
            const yPos = Math.sin(phi) * Math.sin(theta) * b * distortion;
            const zPos = Math.cos(phi) * c * distortion;

            // Add a small gap between hemispheres
            const hemisphereGap = 0.05;
            if (xPos > 0) xPos += hemisphereGap;
            else xPos -= hemisphereGap;

            pts.push({
                x: xPos * brainSize,
                y: yPos * brainSize,
                z: zPos * brainSize,
                origX: xPos * brainSize,
                origY: yPos * brainSize,
                origZ: zPos * brainSize,
                opacity: 0.2 + Math.random() * 0.6,
                size: 1 + Math.random() * 1.5,
                brightness: 0
            });
        }
        return pts;
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number;
        let rotationX = 0;
        let rotationY = 0;
        let time = 0;

        const resize = () => {
            const container = canvas.parentElement;
            if (container) {
                canvas.width = container.clientWidth;
                canvas.height = container.clientHeight;
            }
        };

        window.addEventListener("resize", resize);
        resize();

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouseRef.current = {
                x: e.clientX - rect.left - canvas.width / 2,
                y: e.clientY - rect.top - canvas.height / 2,
                active: true
            };
        };

        const handleMouseLeave = () => {
            mouseRef.current.active = false;
        };

        canvas.addEventListener("mousemove", handleMouseMove);
        canvas.addEventListener("mouseleave", handleMouseLeave);

        const render = () => {
            time += 0.02;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            rotationY += rotationSpeed;

            // Breathing effect
            const breath = Math.sin(time * 0.5) * 5;

            // Projection setup
            const fov = 400;
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;

            // Sort points by Z for depth (painter's algorithm)
            const projectedPoints = points.map(p => {
                // Breathing in Z
                const zWithBreath = p.origZ + Math.sin(time + p.origX * 0.01) * 3;

                // Rotation around Y
                let x = p.origX * Math.cos(rotationY) - zWithBreath * Math.sin(rotationY);
                let z = p.origX * Math.sin(rotationY) + zWithBreath * Math.cos(rotationY);
                let y = p.origY;

                // Simple auto-rotation in X too
                const ry = y * Math.cos(0.2) - z * Math.sin(0.2);
                const rz = y * Math.sin(0.2) + z * Math.cos(0.2);
                y = ry;
                z = rz;

                // Mouse interaction
                const dx = x - mouseRef.current.x;
                const dy = y - mouseRef.current.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (mouseRef.current.active && dist < 100) {
                    p.brightness = Math.max(p.brightness, (1 - dist / 100) * 2);
                } else {
                    p.brightness *= 0.95;
                }

                // Project
                const scale = fov / (fov + z + 200);
                const px = x * scale + centerX;
                const py = y * scale + centerY;

                return { px, py, pz: z, opacity: p.opacity, size: p.size, brightness: p.brightness };
            });

            // Draw connections first (only if close)
            ctx.beginPath();
            ctx.strokeStyle = "rgba(255, 92, 0, 0.05)";
            ctx.lineWidth = 0.5;
            for (let i = 0; i < projectedPoints.length; i += 4) { // Sample for performance
                for (let j = i + 1; j < i + 15 && j < projectedPoints.length; j++) {
                    const p1 = projectedPoints[i];
                    const p2 = projectedPoints[j];
                    const dx = p1.px - p2.px;
                    const dy = p1.py - p2.py;
                    const dist = dx * dx + dy * dy;

                    if (dist < 1500) {
                        ctx.moveTo(p1.px, p1.py);
                        ctx.lineTo(p2.px, p2.py);
                    }
                }
            }
            ctx.stroke();

            // Draw points
            projectedPoints.forEach(p => {
                const finalOpacity = Math.min(1, p.opacity + p.brightness);
                const finalSize = p.size * (1 + p.brightness * 0.5);

                ctx.fillStyle = `rgba(255, 92, 0, ${finalOpacity})`;
                ctx.beginPath();
                ctx.arc(p.px, p.py, finalSize, 0, Math.PI * 2);
                ctx.fill();

                if (p.brightness > 0.1) {
                    ctx.shadowBlur = 10 * p.brightness;
                    ctx.shadowColor = "#FF5C00";
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
            });

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener("resize", resize);
            cancelAnimationFrame(animationFrameId);
            canvas.removeEventListener("mousemove", handleMouseMove);
            canvas.removeEventListener("mouseleave", handleMouseLeave);
        };
    }, [points]);

    return (
        <canvas
            ref={canvasRef}
            className="w-full h-full cursor-crosshair"
            style={{ filter: "drop-shadow(0 0 20px rgba(255, 92, 0, 0.1))" }}
        />
    );
}
