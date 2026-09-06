'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, Volume2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  cancelGermanSpeech,
  isSpeechSupported,
  primeGermanSpeech,
  speakGerman,
} from '@/lib/audio/speech'

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
 * native Audio-Datei → deutsche Web-Speech-API → deaktivierter Button mit
 * Hinweis. Touch-Target liegt mit min-h-14 deutlich über den geforderten
 * 48×48px.
 *
 * Autoplay-/Gesten-sicher: Die Sprachausgabe startet synchron im Klick-Handler,
 * die deutschen Stimmen werden bereits beim Mounten vorgewärmt (`primeGermanSpeech`).
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

  // Deutsche Stimmen früh laden, damit der erste Klick nicht blockiert.
  useEffect(() => {
    primeGermanSpeech()
  }, [])

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
      audioRef.current = null
      cancelGermanSpeech()
    }
  }, [])

  /** Startet die deutsche Sprachausgabe. Gibt zurück, ob sie starten konnte. */
  const speak = useCallback((): boolean => {
    if (!isSpeechSupported()) return false
    const result = speakGerman(text, {
      rate: SPEECH_RATE,
      lang: 'de-DE',
      onEnd: () => setIsPlaying(false),
      onError: () => setIsPlaying(false),
    })
    return result === 'started'
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
          // Datei nicht abspielbar (z.B. webm auf iOS): auf Sprachausgabe wechseln.
          if (!speak()) {
            setIsPlaying(false)
            onUnsupported?.()
          }
        }
        void audio.play().catch((err) => {
          console.error('Audio-Datei nicht abspielbar, wechsle zur Sprachausgabe:', err)
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
        'inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl px-6 py-3 text-xl font-bold transition-colors focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00] sm:w-auto',
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
