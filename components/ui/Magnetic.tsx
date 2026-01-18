'use client';

import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';

export default function Magnetic({ children }: { children: React.ReactNode }) {
    const ref = useRef<HTMLDivElement>(null);
    const rectRef = useRef<DOMRect | null>(null);

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.matchMedia("(max-width: 1024px)").matches);
        };
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // 1. Motion Values (No React Re-renders)
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // 2. Spring Physics (Exact Match: stiffness 150, damping 15, mass 0.1)
    const springX = useSpring(x, { stiffness: 150, damping: 15, mass: 0.1 });
    const springY = useSpring(y, { stiffness: 150, damping: 15, mass: 0.1 });

    const handleMouseEnter = () => {
        if (isMobile) return;
        if (ref.current) {
            rectRef.current = ref.current.getBoundingClientRect();
        }
    };

    const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isMobile) return;
        // Use cached rect if available, fallback to getBoundingClientRect if needed (safety)
        const rect = rectRef.current || ref.current?.getBoundingClientRect();

        if (rect) {
            const { clientX, clientY } = e;
            const { height, width, left, top } = rect;
            const middleX = clientX - (left + width / 2);
            const middleY = clientY - (top + height / 2);

            // Directly update motion values
            x.set(middleX * 0.1);
            y.set(middleY * 0.1);
        }
    };

    const reset = () => {
        x.set(0);
        y.set(0);
        rectRef.current = null;
    };

    if (isMobile) {
        return <div className="relative">{children}</div>;
    }

    return (
        <motion.div
            style={{ position: 'relative', x: springX, y: springY }}
            ref={ref}
            onMouseEnter={handleMouseEnter}
            onMouseMove={handleMouse}
            onMouseLeave={reset}
        >
            {children}
        </motion.div>
    );
}
