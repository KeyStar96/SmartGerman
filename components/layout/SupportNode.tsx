"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, Transition } from "framer-motion";
import { MessageCircle, Mail, X, HelpCircle, ArrowUpRight, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

interface SupportNodeProps {
    dictionary: any;
}

export default function SupportNode({ dictionary }: SupportNodeProps) {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    // Hide on any route containing "registration"
    if (pathname?.includes("registration")) {
        return null;
    }

    const toggleOpen = () => setIsOpen(!isOpen);

    // Animation Config (Swiss Smoothness)
    const spring: Transition = { type: "spring", stiffness: 400, damping: 30 };

    // Fallback dictionary text
    const t = {
        telegram: dictionary?.support_node?.telegram || "Telegram",
        email: dictionary?.support_node?.email || "Email",
        whatsapp: dictionary?.support_node?.whatsapp || "WhatsApp",
    };

    // Observer for mobile menu to hide support node
    const [isHidden, setIsHidden] = useState(false);
    useEffect(() => {
        const checkBody = () => {
            // Check if body has 'mobile-menu-open' class (toggled by Header)
            if (document.body.classList.contains("mobile-menu-open")) {
                setIsHidden(true);
            } else {
                setIsHidden(false);
            }
        };

        // Check initially
        checkBody();

        // Observe changes
        const observer = new MutationObserver(checkBody);
        observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });

        return () => observer.disconnect();
    }, []);

    // Also hide if hidden by menu
    if (isHidden) return null;

    return (
        <div className="fixed bottom-8 right-8 z-[9999] flex flex-col items-end gap-4 pointer-events-none">

            {/* --- BACKDROP (Click outside to close) --- */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[-1] pointer-events-auto"
                    onClick={() => setIsOpen(false)}
                    aria-hidden="true"
                />
            )}

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
                        {/* Option 1: WhatsApp (NEW) */}
                        <a
                            href="https://wa.me/491714758620"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center justify-between p-4 bg-[#1E2024]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl hover:bg-[#25D366] transition-colors duration-300"
                        >
                            <div className="flex items-center gap-3">
                                <Phone size={18} className="text-white group-hover:scale-110 transition-transform" />
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-white uppercase tracking-wider">{t.whatsapp}</span>
                                </div>
                            </div>
                            <ArrowUpRight size={14} className="text-white/30 group-hover:text-white" />
                        </a>

                        {/* Option 2: Telegram */}
                        <a
                            href="https://t.me/smartgerman"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center justify-between p-4 bg-[#1E2024]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl hover:bg-[#229ED9] transition-colors duration-300"
                        >
                            <div className="flex items-center gap-3">
                                <MessageCircle size={18} className="text-white group-hover:scale-110 transition-transform" />
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-white uppercase tracking-wider">{t.telegram}</span>
                                </div>
                            </div>
                            <ArrowUpRight size={14} className="text-white/30 group-hover:text-white" />
                        </a>

                        {/* Option 3: Email */}
                        <a
                            href="mailto:info@smart-german.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center justify-between p-4 bg-[#1E2024]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl hover:bg-[#FF5C00] transition-colors duration-300"
                        >
                            <div className="flex items-center gap-3">
                                <Mail size={18} className="text-white group-hover:scale-110 transition-transform" />
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-white uppercase tracking-wider">{t.email}</span>
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
                                {/* REMOVED: Status Dot indicating "Online" */}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.button>

        </div>
    );
}