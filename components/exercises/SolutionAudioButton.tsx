'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, Volume2 } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Etwas langsamer als Normaltempo – gleiche Einstellung wie im Vokabeltrainer. */
const SPEECH_RATE = 0.9

interface SolutionAudioButtonProps {
  /** Text, der bei fehlender Audio-Datei per Web-Speech-API gesprochen wird. */
  text: string
  /** Native Audio-Spur, falls vorhanden. */
  audioUrl?: string | null
  label: string
  ariaLabel: string
  variant?: 'primary' | 'secondary'
  onUnsupported?: () => void
}

/**
 * Tap-to-Listen-Button mit dreistufiger Fallback-Kette:
 * native Audio-Datei → Web-Speech-API → deaktivierter Button mit Hinweis.
 * Touch-Target liegt mit min-h-14 deutlich über den geforderten 48×48px.
 */
export default function SolutionAudioButton({
  text,
  audioUrl,
  label,
  ariaLabel,
  variant = 'primary',
  onUnsupported,
}: SolutionAudioButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
      audioRef.current = null
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const speak = useCallback((): boolean => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false

    try {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'de-DE'
      utterance.rate = SPEECH_RATE
      utterance.onend = () => setIsPlaying(false)
      utterance.onerror = () => setIsPlaying(false)
      window.speechSynthesis.speak(utterance)
      return true
    } catch (err) {
      console.error('Sprachausgabe fehlgeschlagen:', err)
      return false
    }
  }, [text])

  const handleClick = useCallback(() => {
    if (isPlaying) return
    setIsPlaying(true)

    if (audioUrl) {
      try {
        const audio = new Audio(audioUrl)
        audioRef.current = audio
        audio.onended = () => setIsPlaying(false)
        audio.onerror = () => {
          // Datei nicht abspielbar: still auf die Sprachausgabe wechseln.
          if (!speak()) {
            setIsPlaying(false)
            onUnsupported?.()
          }
        }
        void audio.play().catch(() => {
          if (!speak()) {
            setIsPlaying(false)
            onUnsupported?.()
          }
        })
        return
      } catch (err) {
        console.error('Audio-Wiedergabe fehlgeschlagen:', err)
      }
    }

    if (!speak()) {
      setIsPlaying(false)
      onUnsupported?.()
    }
  }, [audioUrl, isPlaying, onUnsupported, speak])

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={ariaLabel}
      className={cn(
        'inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl px-6 py-3 text-xl font-bold transition-colors focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00]',
        variant === 'primary'
          ? 'bg-blue-600 text-white shadow-md hover:bg-blue-500'
          : 'border-2 border-blue-200 bg-white text-blue-700 hover:bg-blue-50'
      )}
    >
      {isPlaying ? (
        <Loader2 size={28} className="animate-spin" aria-hidden="true" />
      ) : (
        <Volume2 size={28} aria-hidden="true" />
      )}
      <span>{label}</span>
    </button>
  )
}
