"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { GraduationCap, Brain, Users, Globe2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface WhyUsDictionary {
    WhyUs: {
        header: { label: string; title_Line1: string; title_Line2: string };
        card1: { category: string; title: string; text: string; specialization: string };
        card2: { category: string; title: string; items: Array<{ name: string; desc: string }> };
        card3: { category: string; title: string; text: string };
        card4: { category: string; title: string; text: string };
    };
}

const GlassCard = React.memo(function GlassCard({ children, className, isOrange = false }: { children: React.ReactNode; className?: string; isOrange?: boolean }) {
    return (
        <div
            className={cn(
                "relative w-full h-full overflow-hidden transition-all duration-700 ease-out group/card rounded-3xl backdrop-blur-3xl",
                isOrange 
                    ? "bg-[#FF5C00]/80 dark:bg-[#FF5C00]/70 border-white/40 shadow-[0_8px_30px_rgb(255,92,0,0.2)]" 
                    : "bg-white/60 dark:bg-[#1a1a1a]/60 border-white/40 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)]",
                "border",
                "hover:shadow-2xl hover:-translate-y-2",
                className
            )}
        >
            <div className={cn(
                "absolute -top-24 -right-24 w-64 h-64 rounded-full transition-all duration-700 group-hover/card:scale-150 z-0",
                isOrange 
                    ? "bg-[radial-gradient(circle,rgba(255,255,255,0.4)_0%,transparent_70%)]" 
                    : "bg-[radial-gradient(circle,rgba(251,146,60,0.3)_0%,transparent_70%)]"
            )} />
            <div className="relative z-10 h-full">
                {children}
            </div>
        </div>
    );
});
GlassCard.displayName = 'GlassCard';

export default function WhyUsHorizontal({ dictionary }: { dictionary: WhyUsDictionary }) {
    const targetRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: targetRef,
        offset: ["start start", "end end"]
    });

    const trackRef = useRef<HTMLDivElement>(null);
    const [scrollDistance, setScrollDistance] = useState(0);

    useEffect(() => {
        const updateDistance = () => {
            if (trackRef.current) {
                setScrollDistance(trackRef.current.scrollWidth - window.innerWidth);
            }
        };
        updateDistance();
        window.addEventListener("resize", updateDistance);
        return () => window.removeEventListener("resize", updateDistance);
    }, []);

    const x = useTransform(scrollYProgress, [0, 1], [0, -scrollDistance]);

    const t = dictionary?.WhyUs;
    if (!t) return null;

    const labelStyle = "font-mono text-xs font-bold uppercase tracking-widest text-[#FF5C00] mb-6 block";
    const whiteLabelStyle = "font-mono text-xs font-bold uppercase tracking-widest text-[#F0EFE9]/90 mb-6 block border-b border-white/20 pb-2";
    const headingStyle = "text-3xl lg:text-4xl font-bold tracking-tighter mb-4 text-[#2D3436] dark:text-[#E2D7CE] transition-colors duration-500 ease-out group-hover/card:text-[#111111] dark:group-hover/card:text-[#F0EFE9] leading-[1.1]";
    const whiteHeadingStyle = "text-3xl lg:text-4xl font-bold tracking-tighter mb-4 text-[#F0EFE9]/90 transition-colors duration-500 ease-out group-hover/card:text-[#F0EFE9] leading-[1.1]";
    const bodyStyle = "text-lg lg:text-xl text-[#2D3436] dark:text-[#E2D7CE] leading-relaxed font-normal tracking-tight transition-colors duration-500 ease-out group-hover/card:text-[#111111] dark:group-hover/card:text-[#F0EFE9]";

    return (
        <>
            {/* DESKTOP (Horizontal Scroll) */}
            <section ref={targetRef} className="hidden lg:block relative h-[300vh] bg-transparent">
                <div className="sticky top-0 h-screen flex flex-col justify-center overflow-hidden pt-20">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(255,92,0,0.05)_0%,transparent_60%)] rounded-full pointer-events-none z-0" />
                    
                    {/* Fixed Title Container */}
                    <div className="w-full max-w-[1400px] mx-auto px-8 lg:px-16 xl:px-32 mb-12 relative z-20 shrink-0">
                        <span className="font-mono text-xs tracking-[0.3em] text-[#FF5C00] uppercase font-bold mb-4 block border border-[#FF5C00]/30 bg-[#FF5C00]/5 px-4 py-1.5 rounded-full w-max backdrop-blur-sm">
                            {t.header.label}
                        </span>
                        <h2 className="text-[clamp(2.5rem,4vw,5rem)] font-bold tracking-tighter uppercase text-[#2D3436] dark:text-[#E2D7CE] leading-[1.05]">
                            {t.header.title_Line1} <span className="text-[#FF5C00]">{t.header.title_Line2}</span>
                        </h2>
                    </div>

                    {/* Scrolling Track for Cards */}
                    <div className="w-full relative z-10 overflow-visible">
                        <motion.div ref={trackRef} style={{ x }} className="flex gap-8 lg:gap-12 w-max px-8 lg:px-16 xl:px-32 pb-12 items-center">
                            
                            {/* Card 1 */}
                            <div className="w-[450px] xl:w-[500px] h-[550px] xl:h-[600px] shrink-0">
                                <GlassCard>
                                    <div className="p-10 xl:p-12 h-full flex flex-col justify-center">
                                        <Brain size={48} strokeWidth={1.5} className="text-[#FF5C00] mb-8" />
                                        <span className={labelStyle}>{t.card1.category}</span>
                                        <h3 className={headingStyle + " text-3xl"}>{t.card1.title}</h3>
                                        <div className={bodyStyle}><p className="text-base xl:text-lg">{t.card1.text}</p></div>
                                        <div className="mt-8 text-xs font-mono text-[#FF5C00] font-bold uppercase tracking-widest pl-4 border-l-2 border-[#FF5C00]">
                                            {t.card1.specialization}
                                        </div>
                                    </div>
                                </GlassCard>
                            </div>

                            {/* Card 2 */}
                            <div className="w-[450px] xl:w-[500px] h-[550px] xl:h-[600px] shrink-0">
                                <GlassCard isOrange>
                                    <div className="p-10 xl:p-12 h-full flex flex-col justify-center">
                                        <GraduationCap size={48} strokeWidth={1.5} className="text-[#F0EFE9] mb-8" />
                                        <span className={whiteLabelStyle}>{t.card2.category}</span>
                                        <h3 className={whiteHeadingStyle + " text-3xl"}>{t.card2.title}</h3>
                                        <ul className="space-y-5 mt-6">
                                            {t.card2.items.map((item: any, idx: number) => (
                                                <li key={idx} className="group/item">
                                                    <div className="flex items-start gap-3 mb-1">
                                                        <CheckCircle2 size={20} strokeWidth={2} className="mt-0.5 flex-shrink-0 text-[#F0EFE9]" />
                                                        <span className="text-base xl:text-lg font-bold uppercase tracking-wide text-[#F0EFE9]">{item.name}</span>
                                                    </div>
                                                    <p className="pl-8 text-[#F0EFE9]/90 font-normal text-sm xl:text-base leading-relaxed">{item.desc}</p>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </GlassCard>
                            </div>

                            {/* Card 3 */}
                            <div className="w-[450px] xl:w-[500px] h-[550px] xl:h-[600px] shrink-0">
                                <GlassCard>
                                    <div className="p-10 xl:p-12 h-full flex flex-col justify-center">
                                        <Users size={48} strokeWidth={1.5} className="text-[#FF5C00] mb-8" />
                                        <span className={labelStyle}>{t.card3.category}</span>
                                        <h3 className={headingStyle + " text-3xl"}>{t.card3.title}</h3>
                                        <div className={bodyStyle}><p className="text-base xl:text-lg">{t.card3.text}</p></div>
                                    </div>
                                </GlassCard>
                            </div>

                            {/* Card 4 */}
                            <div className="w-[450px] xl:w-[500px] h-[550px] xl:h-[600px] shrink-0">
                                <GlassCard>
                                    <div className="p-10 xl:p-12 h-full flex flex-col justify-center">
                                        <Globe2 size={48} strokeWidth={1.5} className="text-[#FF5C00] mb-8" />
                                        <span className={labelStyle}>{t.card4.category}</span>
                                        <h3 className={headingStyle + " text-3xl"}>{t.card4.title}</h3>
                                        <div className={bodyStyle}><p className="text-base xl:text-lg">{t.card4.text}</p></div>
                                    </div>
                                </GlassCard>
                            </div>

                        </motion.div>
                    </div>
                </div>
            </section>

            {/* MOBILE (Vertical Stack) */}
            <section className="block lg:hidden relative py-20 bg-transparent overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(255,92,0,0.05)_0%,transparent_60%)] rounded-full pointer-events-none z-0" />
                
                <div className="container mx-auto px-6 relative z-10 flex flex-col gap-12">
                    <div className="mb-8">
                        <span className="font-mono text-[10px] tracking-[0.3em] text-[#FF5C00] uppercase font-bold mb-6 block border border-[#FF5C00]/30 bg-[#FF5C00]/5 px-4 py-1.5 rounded-full w-max backdrop-blur-sm">
                            {t.header.label}
                        </span>
                        <h2 className="text-4xl font-bold tracking-tighter uppercase text-[#2D3436] dark:text-[#E2D7CE] leading-[1.1]">
                            {t.header.title_Line1} <br />
                            <span className="text-[#FF5C00]">{t.header.title_Line2}</span>
                        </h2>
                    </div>

                    <GlassCard>
                        <div className="p-8">
                            <Brain size={32} strokeWidth={1.5} className="text-[#FF5C00] mb-6" />
                            <span className={labelStyle}>{t.card1.category}</span>
                            <h3 className={headingStyle}>{t.card1.title}</h3>
                            <div className={bodyStyle}><p className="text-base">{t.card1.text}</p></div>
                            <div className="mt-6 text-[10px] font-mono text-[#FF5C00] font-bold uppercase tracking-widest pl-4 border-l-2 border-[#FF5C00]">
                                {t.card1.specialization}
                            </div>
                        </div>
                    </GlassCard>

                    <GlassCard isOrange>
                        <div className="p-8">
                            <GraduationCap size={32} strokeWidth={1.5} className="text-[#F0EFE9] mb-6" />
                            <span className={whiteLabelStyle}>{t.card2.category}</span>
                            <h3 className={whiteHeadingStyle}>{t.card2.title}</h3>
                            <ul className="space-y-6 mt-8">
                                {t.card2.items.map((item: any, idx: number) => (
                                    <li key={idx} className="group/item">
                                        <div className="flex items-start gap-3 mb-1">
                                            <CheckCircle2 size={18} strokeWidth={2} className="mt-0.5 flex-shrink-0 text-[#F0EFE9]" />
                                            <span className="text-base font-bold uppercase tracking-wide text-[#F0EFE9]">{item.name}</span>
                                        </div>
                                        <p className="pl-8 text-[#F0EFE9]/90 font-normal text-xs leading-relaxed">{item.desc}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </GlassCard>

                    <GlassCard>
                        <div className="p-8">
                            <Users size={32} strokeWidth={1.5} className="text-[#FF5C00] mb-6" />
                            <span className={labelStyle}>{t.card3.category}</span>
                            <h3 className={headingStyle}>{t.card3.title}</h3>
                            <div className={bodyStyle}><p className="text-base">{t.card3.text}</p></div>
                        </div>
                    </GlassCard>

                    <GlassCard>
                        <div className="p-8">
                            <Globe2 size={32} strokeWidth={1.5} className="text-[#FF5C00] mb-6" />
                            <span className={labelStyle}>{t.card4.category}</span>
                            <h3 className={headingStyle}>{t.card4.title}</h3>
                            <div className={bodyStyle}><p className="text-base">{t.card4.text}</p></div>
                        </div>
                    </GlassCard>
                </div>
            </section>
        </>
    );
}
