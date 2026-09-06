'use client'

/**
 * Robuste deutsche Sprachausgabe über die native Web-Speech-API
 * (`window.speechSynthesis`).
 *
 * Warum ein eigener Helfer statt Inline-Code in den Komponenten:
 * - **Voice-Loading:** `getVoices()` ist gerade auf mobilen Browsern beim
 *   ersten Aufruf oft leer und wird erst asynchron über das `voiceschanged`-
 *   Event befüllt. Wir cachen die Liste zentral und halten sie aktuell.
 * - **Autoplay-/Gesten-Regeln:** `speak()` muss synchron aus einem echten
 *   Klick-Handler heraus starten. Deshalb blockiert dieser Helfer nie mit
 *   `await`; er nutzt die bereits gecachten Stimmen und fällt sonst auf die
 *   Browser-Standardstimme für `de-DE` zurück.
 * - **Konsistenz:** Vokabeltrainer und Grammatik-Übungen sollen exakt dieselbe
 *   deutsche Aussprache-Logik verwenden.
 */

export interface SpeakGermanOptions {
  /** Sprech-Tempo (1 = normal). Etwas langsamer hilft beim Nachsprechen. */
  rate?: number
  /** BCP-47-Sprachcode, Standard `de-DE`. */
  lang?: string
  onStart?: () => void
  onEnd?: () => void
  onError?: () => void
}

export type SpeakGermanResult = 'started' | 'unsupported' | 'error'

/** Zentraler Cache der verfügbaren Stimmen; via `voiceschanged` aktuell gehalten. */
let cachedVoices: SpeechSynthesisVoice[] = []
let primed = false

export function isSpeechSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof window.SpeechSynthesisUtterance !== 'undefined'
  )
}

function refreshVoices(): void {
  if (!isSpeechSupported()) return
  const voices = window.speechSynthesis.getVoices()
  if (voices.length > 0) cachedVoices = voices
}

/**
 * Wärmt die Stimmenliste vor. Idempotent – sollte einmal beim Mounten der
 * jeweiligen Komponente aufgerufen werden, damit beim ersten Klick bereits
 * eine deutsche Stimme bereitsteht (statt erst asynchron nachzuladen).
 */
export function primeGermanSpeech(): void {
  if (!isSpeechSupported() || primed) return
  primed = true
  refreshVoices()
  // `voiceschanged` feuert (u.a. auf Chrome/Android) erst nach dem Laden.
  if (typeof window.speechSynthesis.addEventListener === 'function') {
    window.speechSynthesis.addEventListener('voiceschanged', refreshVoices)
  } else {
    window.speechSynthesis.onvoiceschanged = refreshVoices
  }
}

/**
 * Wählt die beste deutsche Stimme:
 * exaktes `de-DE` und lokal (offline) bevorzugt, danach irgendein `de-*`.
 * Gibt `null` zurück, wenn keine deutsche Stimme vorhanden ist – dann sorgt
 * `utterance.lang = 'de-DE'` dafür, dass der Browser selbst eine passende
 * Standardstimme wählt.
 */
export function pickGermanVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const german = voices.filter((voice) => voice.lang?.toLowerCase().startsWith('de'))
  if (german.length === 0) return null

  return (
    german.find((voice) => voice.lang.toLowerCase() === 'de-de' && voice.localService) ??
    german.find((voice) => voice.lang.toLowerCase() === 'de-de') ??
    german.find((voice) => voice.localService) ??
    german[0] ??
    null
  )
}

/**
 * Spricht deutschen Text aus. MUSS synchron aus einem Klick-Handler heraus
 * aufgerufen werden (Autoplay-Regeln). Blockiert nie – nutzt die gecachten
 * Stimmen und fällt sonst auf die Browser-Standardstimme für `de-DE` zurück.
 */
export function speakGerman(text: string, options: SpeakGermanOptions = {}): SpeakGermanResult {
  if (!isSpeechSupported()) return 'unsupported'

  const trimmed = text.trim()
  if (!trimmed) return 'error'

  try {
    const synth = window.speechSynthesis
    // Laufende Ausgabe abbrechen, damit sich schnelle Klicks nicht stapeln.
    synth.cancel()

    // Falls die Stimmen noch nicht gecacht sind, synchron ein letztes Mal
    // versuchen (ohne await – reiner Lesezugriff).
    if (cachedVoices.length === 0) refreshVoices()

    const utterance = new SpeechSynthesisUtterance(trimmed)
    utterance.lang = options.lang ?? 'de-DE'
    utterance.rate = options.rate ?? 1
    const voice = pickGermanVoice(cachedVoices)
    if (voice) utterance.voice = voice

    if (options.onStart) utterance.onstart = options.onStart
    if (options.onEnd) utterance.onend = options.onEnd
    if (options.onError) utterance.onerror = options.onError

    synth.speak(utterance)

    // iOS/Safari lässt die Ausgabe nach `cancel()` gelegentlich pausiert –
    // ein sofortiges `resume()` stellt sicher, dass sie hörbar startet.
    if (synth.paused) synth.resume()

    return 'started'
  } catch (err) {
    console.error('Deutsche Sprachausgabe fehlgeschlagen:', err)
    return 'error'
  }
}

/** Bricht eine laufende Sprachausgabe ab (z.B. beim Unmount). */
export function cancelGermanSpeech(): void {
  if (isSpeechSupported()) window.speechSynthesis.cancel()
}
