"use client";

import React from "react";
import { Marquee } from "@/components/ui/Marquee";
import { Star } from "lucide-react";
import { JetBrains_Mono } from "next/font/google";
import { cn } from "@/lib/utils";

const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] });

// Dummy Data for the placeholder design
const dummyReviews = [
    {
        id: 1,
        author: "Sarah M.",
        rating: 5,
        text: "The best language school I've ever attended! The teachers are incredibly patient and the online platform is flawless. I learned so much in just 3 months.",
        date: "Vor 2 Wochen",
        avatar: "S"
    },
    {
        id: 2,
        author: "Alexey V.",
        rating: 5,
        text: "Sitov Academy completely changed my perspective on learning German. It used to be so hard, but their method makes it logical and fun. Highly recommended!",
        date: "Vor 1 Monat",
        avatar: "A"
    },
    {
        id: 3,
        author: "Elena R.",
        rating: 5,
        text: "Ich habe hier meinen B2-Kurs absolviert. Die Vorbereitung auf die Prüfung war exzellent. Sehr professionelles und freundliches Team.",
        date: "Vor 3 Monaten",
        avatar: "E"
    },
    {
        id: 4,
        author: "David K.",
        rating: 5,
        text: "Amazing experience! The trial lesson was free and convinced me instantly. The hybrid model (online + presence) works perfectly for my busy schedule.",
        date: "Vor 1 Woche",
        avatar: "D"
    },
    {
        id: 5,
        author: "Maria S.",
        rating: 5,
        text: "Прекрасная школа! Преподаватели очень внимательные, атмосфера на уроках дружелюбная. Мой немецкий стал намного лучше.",
        date: "Vor 2 Monaten",
        avatar: "M"
    }
];

// Helper to render stars
const Stars = ({ rating }: { rating: number }) => {
    return (
        <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
                <Star
                    key={i}
                    className={cn(
                        "w-4 h-4",
                        i < rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700"
                    )}
                />
            ))}
        </div>
    );
};

// Review Card Component
const ReviewCard = ({ review }: { review: typeof dummyReviews[0] }) => {
    return (
        <div className="relative flex flex-col justify-between w-[320px] sm:w-[380px] p-6 rounded-3xl mx-3 
                        bg-white/60 dark:bg-[#1A1A1A]/60 backdrop-blur-xl border border-white/20 dark:border-white/10 
                        shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] 
                        transition-all duration-300 hover:scale-[1.02] hover:bg-white/80 dark:hover:bg-[#222222]/80">
            
            {/* Google Icon Badge */}
            <div className="absolute top-6 right-6 flex items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
                <svg viewBox="0 0 24 24" className="w-5 h-5">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
            </div>

            <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-[#FF5C00] to-orange-400 text-white font-bold text-lg shadow-inner">
                    {review.avatar}
                </div>
                <div>
                    <h4 className="font-bold text-gray-900 dark:text-white leading-tight">{review.author}</h4>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{review.date}</span>
                </div>
            </div>

            <div className="mb-4">
                <Stars rating={review.rating} />
            </div>

            <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
                "{review.text}"
            </p>
        </div>
    );
};

interface GoogleReviewsProps {
    title: string;
}

export default function GoogleReviews({ title }: GoogleReviewsProps) {
    // Split the dummy reviews into two rows for the marquee effect
    const firstRow = dummyReviews.slice(0, 3);
    const secondRow = dummyReviews.slice(2, 5);

    return (
        <section className="relative py-24 sm:py-32 overflow-hidden bg-transparent">
            {/* Background gradient / glow effects */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#FF5C00]/5 dark:bg-[#FF5C00]/10 blur-[120px] rounded-full pointer-events-none -z-10" />

            <div className="max-w-7xl mx-auto px-6 lg:px-8 mb-16 text-center">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-4">
                    {title}
                </h2>
                <div className="flex items-center justify-center gap-2">
                    <span className={cn("text-sm tracking-widest uppercase text-gray-500 font-semibold", jetbrainsMono.className)}>
                        Excellent
                    </span>
                    <Stars rating={5} />
                    <span className={cn("text-sm text-gray-500", jetbrainsMono.className)}>
                        5.0 out of 5 based on Google Reviews
                    </span>
                </div>
            </div>

            {/* Marquee Wrapper with fading edges */}
            <div className="relative flex flex-col gap-6 mask-edges-horizontal">
                <Marquee pauseOnHover className="[--duration:50s]">
                    {firstRow.map((review) => (
                        <ReviewCard key={review.id} review={review} />
                    ))}
                </Marquee>
                
                <Marquee reverse pauseOnHover className="[--duration:50s]">
                    {secondRow.map((review) => (
                        <ReviewCard key={review.id} review={review} />
                    ))}
                </Marquee>
            </div>
        </section>
    );
}
