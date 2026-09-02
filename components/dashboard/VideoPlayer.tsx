'use client'

import { useRef, useState } from 'react'
import { FastForward, Pause, Play, Rewind, Settings } from 'lucide-react'

export interface VideoPlayerLabels {
  rewindAria: string
  forwardAria: string
  playAria: string
  pauseAria: string
  speedAria: string
}

export default function VideoPlayer({
  src,
  labels,
}: {
  src: string
  labels: VideoPlayerLabels
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)

  const togglePlay = (): void => {
    const player = videoRef.current
    if (!player) return

    if (isPlaying) {
      player.pause()
    } else {
      void player.play().catch((err: unknown) => {
        console.error('Video konnte nicht abgespielt werden:', err)
      })
    }
  }

  const seekBy = (seconds: number): void => {
    const player = videoRef.current
    if (!player) return
    player.currentTime = Math.max(0, player.currentTime + seconds)
  }

  const toggleSpeed = (): void => {
    const player = videoRef.current
    if (!player) return
    const nextRate = playbackRate === 1 ? 0.8 : 1
    player.playbackRate = nextRate
    setPlaybackRate(nextRate)
  }

  const speedLabel = labels.speedAria.replace('{speed}', `${playbackRate}x`)

  return (
    <div>
      <div className="relative flex aspect-video items-center justify-center bg-black">
        <video
          ref={videoRef}
          src={src}
          className="h-full w-full"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          playsInline
          controls={false}
        />
      </div>

      <div className="flex flex-col items-stretch gap-3 bg-slate-900 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-4 sm:p-6">
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => seekBy(-10)}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-800 text-white transition-colors hover:bg-slate-700 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00]"
            aria-label={labels.rewindAria}
          >
            <Rewind size={28} aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={togglePlay}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00]"
            aria-label={isPlaying ? labels.pauseAria : labels.playAria}
          >
            {isPlaying ? (
              <Pause size={36} aria-hidden="true" />
            ) : (
              <Play size={36} className="ml-1" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            onClick={() => seekBy(10)}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-800 text-white transition-colors hover:bg-slate-700 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00]"
            aria-label={labels.forwardAria}
          >
            <FastForward size={28} aria-hidden="true" />
          </button>
        </div>

        <button
          type="button"
          onClick={toggleSpeed}
          className={`inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl px-6 text-lg font-bold transition-colors focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00] ${
            playbackRate === 0.8 ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
          }`}
          aria-label={speedLabel}
        >
          <Settings size={22} aria-hidden="true" />
          {playbackRate}x
        </button>
      </div>
    </div>
  )
}
