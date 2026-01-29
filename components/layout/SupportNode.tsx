"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Mail, X, HelpCircle, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SupportNodeProps {
    // Optional: Dictionary props passing if needed later
}

export default function SupportNode() {
    const [isOpen, setIsOpen] = useState(false);

    const toggleOpen = () => setIsOpen(!isOpen);

    // Animation Config (Swiss Smoothness)
    const spring = { type: "spring", stiffness: 400, damping: 30 };

    return (
        <div className="fixed bottom-8 right-8 z-[9999] flex flex-col items-end gap-4 pointer-events-none">

            {/* --- EXPANDED MENU (The Options) --- */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        transition={spring}
                        className="flex flex-col gap-2 pointer-events-auto min-w-[200px]"
                    >
                        {/* Option 1: Telegram */}
                        <a
                            href="https://t.me/smartgerman"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center justify-between p-4 bg-[#1E2024]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl hover:bg-[#229ED9] transition-colors duration-300"
                        >
                            <div className="flex items-center gap-3">
                                <MessageCircle size={18} className="text-white group-hover:scale-110 transition-transform" />
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-white uppercase tracking-wider">Telegram</span>
                                    <span className="text-[9px] font-mono text-white/50 group-hover:text-white/80">Direct Chat</span>
                                </div>
                            </div>
                            <ArrowUpRight size={14} className="text-white/30 group-hover:text-white" />
                        </a>

                        {/* Option 2: Email */}
                        <a
                            href="mailto:info@smart-german.com"
                            className="group flex items-center justify-between p-4 bg-[#1E2024]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl hover:bg-[#FF5C00] transition-colors duration-300"
                        >
                            <div className="flex items-center gap-3">
                                <Mail size={18} className="text-white group-hover:scale-110 transition-transform" />
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-white uppercase tracking-wider">Email</span>
                                    <span className="text-[9px] font-mono text-white/50 group-hover:text-white/80">Beratung</span>
                                </div>
                            </div>
                            <ArrowUpRight size={14} className="text-white/30 group-hover:text-white" />
                        </a>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- THE TRIGGER (The Floating Orb) --- */}
            <motion.button
                onClick={toggleOpen}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                    "pointer-events-auto relative flex items-center justify-center h-14 w-14 rounded-full shadow-2xl transition-all duration-500",
                    isOpen
                        ? "bg-[#1E2024] rotate-90"
                        : "bg-[#FF5C00] hover:bg-[#E05200]" // Orange brand color
                )}
            >
                {/* Texture Overlay */}
                <div className="absolute inset-0 bg-noise-paper opacity-20 rounded-full pointer-events-none mix-blend-overlay" />

                {/* Inner Icon Swapping */}
                <div className="relative z-10 text-white">
                    <AnimatePresence mode="wait">
                        {isOpen ? (
                            <motion.div
                                key="close"
                                initial={{ rotate: -90, opacity: 0 }}
                                animate={{ rotate: 0, opacity: 1 }}
                                exit={{ rotate: 90, opacity: 0 }}
                            >
                                <X size={24} />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="open"
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.5, opacity: 0 }}
                                className="relative"
                            >
                                <HelpCircle size={28} strokeWidth={2} />
                                {/* Status Dot indicating "Online" */}
                                <span className="absolute top-0 right-0 flex h-2.5 w-2.5 translate-x-1 -translate-y-1">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400 border border-[#FF5C00]"></span>
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.button>

        </div>
    );
}