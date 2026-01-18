'use client';

import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useRef } from 'react';

export default function Magnetic({ children }: { children: React.ReactNode }) {
    const ref = useRef<HTMLDivElement>(null);

    // 1. Motion Values (No React Re-renders)
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // 2. Spring Physics (Exact Match: stiffness 150, damping 15, mass 0.1)
    const springX = useSpring(x, { stiffness: 150, damping: 15, mass: 0.1 });
    const springY = useSpring(y, { stiffness: 150, damping: 15, mass: 0.1 });

    const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
        const { clientX, clientY } = e;
        const rect = ref.current?.getBoundingClientRect();

        if (rect) {
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
    };

    return (
        <motion.div
            style={{ position: 'relative', x: springX, y: springY }}
            ref={ref}
            onMouseMove={handleMouse}
            onMouseLeave={reset}
        >
            {children}
        </motion.div>
    );
}
