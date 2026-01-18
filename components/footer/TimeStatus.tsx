'use client';

import React, { useState, useEffect, memo } from 'react';
import { isOpenNow } from '@/lib/time-utils';

const TimeStatus = memo(function TimeStatus() {
    const [isOpen, setIsOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState("");

    useEffect(() => {
        setIsOpen(isOpenNow());
        const updateTime = () => {
            const now = new Date().toLocaleTimeString("de-DE", {
                timeZone: "Europe/Berlin",
                hour: "2-digit",
                minute: "2-digit"
            });
            setCurrentTime(now);
        };
        updateTime();
        const interval = setInterval(updateTime, 60000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-3 h-3">
                <div className={`absolute inset-0 rounded-full opacity-50 animate-ping ${isOpen ? 'bg-green-500' : 'bg-red-500'}`} />
                <div className={`relative w-2 h-2 rounded-full ${isOpen ? 'bg-green-500' : 'bg-red-500'}`} />
            </div>
            <span className="font-mono text-xs text-white/70 uppercase tracking-widest">
                Hannover {currentTime} • {isOpen ? "Open" : "Closed"}
            </span>
        </div>
    );
});

export default TimeStatus;
