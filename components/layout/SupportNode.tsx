"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Mail, X, HelpCircle, ArrowUpRight, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

interface SupportNodeProps {
    dictionary: any;
}

export default function SupportNode({ dictionary }: SupportNodeProps) {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);

    const toggleOpen = () => setIsOpen(!isOpen);

    // Magnetic Button Logic
    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!buttonRef.current) return;
        const { clientX, clientY } = e;
        const { top, left, width, height } = buttonRef.current.getBoundingClientRect();
        const x = clientX - (left + width / 2);
        const y = clientY - (top + height / 2);
        setMousePosition({ x, y });
    };

    const handleMouseLeave = () => {
        setMousePosition({ x: 0, y: 0 });
    };

    // Fallback dictionary text
    const t = {
        telegram: dictionary?.support_node?.telegram || "Telegram",
        email: dictionary?.support_node?.email || "Email",
        whatsapp: dictionary?.support_node?.whatsapp || "WhatsApp",
    };

    // Logic: Only show on Start Page (Home)
    const isHomePage = pathname === "/" || /^\/[a-z]{2}$/.test(pathname || "");

    if (!isHomePage) return null;

    // --- Framer Motion Variants ---
    const containerVariants: import("framer-motion").Variants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.08, delayChildren: 0.05 }
        },
        exit: {
            opacity: 0,
            transition: { staggerChildren: 0.05, staggerDirection: -1 }
        }
    };

    const itemVariants: import("framer-motion").Variants = {
        hidden: { opacity: 0, y: 20, scale: 0.95 },
        show: { 
            opacity: 1, y: 0, scale: 1, 
            transition: { type: "spring", stiffness: 400, damping: 30 } 
        },
        exit: { 
            opacity: 0, y: 15, scale: 0.95, 
            transition: { duration: 0.2 } 
        }
    };

    return (
        <div className="fixed bottom-8 right-8 z-[9999] flex flex-col items-end gap-5 pointer-events-none">

            {/* --- BACKDROP (Click outside to close) --- */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[-1] pointer-events-auto bg-black/5 backdrop-blur-[2px]"
                        onClick={() => setIsOpen(false)}
                        aria-hidden="true"
                    />
                )}
            </AnimatePresence>

            {/* --- EXPANDED MENU (The Options) --- */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        exit="exit"
                        className="flex flex-col gap-3 pointer-events-auto min-w-[240px]"
                    >
                        {/* Option 1: WhatsApp */}
                        <motion.a
                            variants={itemVariants}
                            href="https://wa.me/491714758620"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center justify-between p-4 bg-[#1E2024]/80 backdrop-blur-2xl border border-white/5 rounded-2xl shadow-2xl hover:bg-[#25D366]/10 hover:border-[#25D366]/30 transition-colors duration-500 overflow-hidden relative"
                        >
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-[#25D366]/0 to-[#25D366]/10 transition-opacity duration-500" />
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="p-2.5 rounded-full bg-white/5 group-hover:bg-[#25D366]/20 border border-white/5 group-hover:border-[#25D366]/20 transition-colors duration-500">
                                    <Phone size={16} className="text-white/70 group-hover:text-[#25D366] transition-colors duration-500" />
                                </div>
                                <span className="text-[13px] font-bold text-white/90 group-hover:text-white transition-colors tracking-wide uppercase">{t.whatsapp}</span>
                            </div>
                            <ArrowUpRight size={16} className="text-white/30 group-hover:text-[#25D366] group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-500 relative z-10" />
                        </motion.a>

                        {/* Option 2: Telegram */}
                        <motion.a
                            variants={itemVariants}
                            href="https://t.me/Sprachschule_Anastasia"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center justify-between p-4 bg-[#1E2024]/80 backdrop-blur-2xl border border-white/5 rounded-2xl shadow-2xl hover:bg-[#229ED9]/10 hover:border-[#229ED9]/30 transition-colors duration-500 overflow-hidden relative"
                        >
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-[#229ED9]/0 to-[#229ED9]/10 transition-opacity duration-500" />
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="p-2.5 rounded-full bg-white/5 group-hover:bg-[#229ED9]/20 border border-white/5 group-hover:border-[#229ED9]/20 transition-colors duration-500">
                                    <MessageCircle size={16} className="text-white/70 group-hover:text-[#229ED9] transition-colors duration-500" />
                                </div>
                                <span className="text-[13px] font-bold text-white/90 group-hover:text-white transition-colors tracking-wide uppercase">{t.telegram}</span>
                            </div>
                            <ArrowUpRight size={16} className="text-white/30 group-hover:text-[#229ED9] group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-500 relative z-10" />
                        </motion.a>

                        {/* Option 3: Email */}
                        <motion.a
                            variants={itemVariants}
                            href="mailto:info@sitov-academy.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center justify-between p-4 bg-[#1E2024]/80 backdrop-blur-2xl border border-white/5 rounded-2xl shadow-2xl hover:bg-[#FF5C00]/10 hover:border-[#FF5C00]/30 transition-colors duration-500 overflow-hidden relative"
                        >
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-[#FF5C00]/0 to-[#FF5C00]/10 transition-opacity duration-500" />
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="p-2.5 rounded-full bg-white/5 group-hover:bg-[#FF5C00]/20 border border-white/5 group-hover:border-[#FF5C00]/20 transition-colors duration-500">
                                    <Mail size={16} className="text-white/70 group-hover:text-[#FF5C00] transition-colors duration-500" />
                                </div>
                                <span className="text-[13px] font-bold text-white/90 group-hover:text-white transition-colors tracking-wide uppercase">{t.email}</span>
                            </div>
                            <ArrowUpRight size={16} className="text-white/30 group-hover:text-[#FF5C00] group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-500 relative z-10" />
                        </motion.a>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- THE TRIGGER (The Floating Orb) --- */}
            <motion.div
                className="pointer-events-auto"
                animate={{
                    x: mousePosition.x * 0.15,
                    y: mousePosition.y * 0.15,
                }}
                transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.5 }}
            >
                <motion.button
                    ref={buttonRef}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    onClick={toggleOpen}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                        "relative flex items-center justify-center h-16 w-16 rounded-full transition-all duration-500 group",
                        isOpen
                            ? "bg-[#1E2024] shadow-[0_0_20px_rgba(30,32,36,0.3)]"
                            : "bg-gradient-to-br from-[#FF7A33] to-[#FF5C00] hover:from-[#FF8C4D] hover:to-[#E05200] shadow-[0_0_30px_rgba(255,92,0,0.4)] hover:shadow-[0_0_40px_rgba(255,92,0,0.6)]"
                    )}
                >
                    {/* Glowing Underlay when closed */}
                    {!isOpen && (
                        <div className="absolute inset-0 rounded-full bg-[#FF5C00] opacity-30 blur-xl group-hover:opacity-50 transition-opacity duration-500" />
                    )}

                    {/* Texture Overlay */}
                    <div className="absolute inset-0 bg-noise-paper opacity-20 rounded-full pointer-events-none mix-blend-overlay" />
                    
                    {/* Inner Gradient Border (Subtle 3D effect) */}
                    <div className="absolute inset-0 rounded-full border-[1.5px] border-white/20 group-hover:border-white/40 transition-colors duration-500 pointer-events-none" />

                    {/* Inner Icon Swapping */}
                    <div className="relative z-10 text-white">
                        <AnimatePresence mode="wait">
                            {isOpen ? (
                                <motion.div
                                    key="close"
                                    initial={{ rotate: -90, opacity: 0 }}
                                    animate={{ rotate: 0, opacity: 1 }}
                                    exit={{ rotate: 90, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <X size={26} strokeWidth={2.5} />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="open"
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.5, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="flex items-center justify-center"
                                >
                                    <HelpCircle size={28} strokeWidth={2.5} className="group-hover:scale-110 transition-transform duration-500" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.button>
            </motion.div>

        </div>
    );
}