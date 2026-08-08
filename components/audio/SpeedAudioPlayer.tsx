"use client"

import React, { useRef, useState } from 'react'

type SpeedAudioPlayerProps = {
  src: string;
  className?: string;
}

export default function SpeedAudioPlayer({ src, className = '' }: SpeedAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [speed, setSpeed] = useState(1.0)

  const toggleSpeed = () => {
    let newSpeed = 1.0
    if (speed === 1.0) newSpeed = 1.25
    else if (speed === 1.25) newSpeed = 1.5
    else if (speed === 1.5) newSpeed = 0.75
    else if (speed === 0.75) newSpeed = 1.0

    setSpeed(newSpeed)
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed
    }
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <audio ref={audioRef} controls src={src} className="flex-1 min-w-0" />
      <button
        onClick={toggleSpeed}
        type="button"
        title="Wiedergabegeschwindigkeit"
        className="flex-shrink-0 px-2 py-1 text-xs font-bold border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
      >
        {speed.toFixed(2)}x
      </button>
    </div>
  )
}
