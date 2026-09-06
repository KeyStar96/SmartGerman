'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, ListMusic, Volume2 } from 'lucide-react'
import AudioRecorder from '@/components/audio/AudioRecorder'
import WaveformPlayer from '@/components/audio/WaveformPlayer'
import {
  cancelGermanSpeech,
  isSpeechSupported,
  primeGermanSpeech,
  speakGerman,
} from '@/lib/audio/speech'
import {
  createPronunciationTranslator,
  type PronunciationTranslations,
} from '@/lib/pronunciation-i18n'
import type { PronunciationPrompt } from '@/lib/pronunciation-prompts'

/**
 * Satzauswahl + Referenzhören + Aufnahme.
 *
 * Die Waveform der Referenz nutzt denselben `AnalyserNode`-Pfad wie die
 * Wiedergabe eigener Aufnahmen, sobald eine Audio-URL vorliegt. Fehlt die
 * Datei, spricht die Web-Speech-API den Satz vor (ohne simulierte Welle).
 */
export default function PronunciationPractice({
  prompts,
  level,
  translations,
}: {
  prompts: readonly PronunciationPrompt[]
  level: string
  translations?: PronunciationTranslations
}) {
  const t = createPronunciationTranslator(translations ?? {})
  const [selectedId, setSelectedId] = useState<string | null>(prompts[0]?.id ?? null)
  const [isSpeaking, setIsSpeaking] = useState(false)

  const selected = useMemo(
    () => prompts.find((prompt) => prompt.id === selectedId) ?? prompts[0] ?? null,
    [prompts, selectedId]
  )

  useEffect(() => {
    primeGermanSpeech()
    return () => cancelGermanSpeech()
  }, [])

  const handleListenTts = () => {
    if (!selected || isSpeaking) return
    setIsSpeaking(true)
    const result = speakGerman(selected.sentenceDe, {
      rate: 0.85,
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    })
    if (result !== 'started') setIsSpeaking(false)
  }

  if (prompts.length === 0) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-900">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950">
          <ListMusic className="h-8 w-8 text-blue-600" aria-hidden="true" />
        </div>
        <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{t('prompts_empty')}</p>
        <p className="mx-auto mt-2 max-w-md text-base text-slate-600 dark:text-slate-400">
          {t('prompts_empty_hint')}
        </p>
        <div className="mt-8">
          <AudioRecorder level={level} translations={translations} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section
        aria-label={t('prompts_title')}
        className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6"
      >
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('prompts_title')}</h2>
        <p className="mt-1 text-base text-slate-600 dark:text-slate-400">{t('prompts_hint')}</p>

        <ul className="mt-4 grid grid-cols-1 gap-3">
          {prompts.map((prompt, index) => {
            const isSelected = selected?.id === prompt.id
            return (
              <li key={prompt.id}>
                <button
                  type="button"
                  onClick={() => {
                    cancelGermanSpeech()
                    setIsSpeaking(false)
                    setSelectedId(prompt.id)
                  }}
                  aria-pressed={isSelected}
                  className={`flex min-h-14 w-full items-start gap-3 rounded-2xl border-2 p-4 text-left transition-colors focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00] ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/40'
                      : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40 active:bg-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800'
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                    aria-hidden="true"
                  >
                    {isSelected ? <Check size={20} /> : index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {prompt.sentenceDe}
                    </span>
                    {prompt.focus && (
                      <span className="mt-1 block text-sm font-medium text-slate-500 dark:text-slate-400">
                        {t('prompt_focus', { focus: prompt.focus })}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      {selected && (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <p className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {t('reference_label')}
          </p>
          <p className="mt-2 text-2xl font-extrabold leading-snug text-slate-900 dark:text-white">
            {selected.sentenceDe}
          </p>

          <div className="mt-5">
            {selected.audioUrl ? (
              <WaveformPlayer
                src={selected.audioUrl}
                t={t}
                label={t('reference_listen')}
              />
            ) : (
              <button
                type="button"
                onClick={handleListenTts}
                disabled={!isSpeechSupported() || isSpeaking}
                aria-label={t('reference_listen_aria')}
                className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 px-6 py-3 text-xl font-bold text-white shadow-md transition-colors hover:bg-blue-500 active:bg-blue-700 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                <Volume2 size={26} aria-hidden="true" />
                {isSpeaking ? t('reference_speaking') : t('reference_listen')}
              </button>
            )}
          </div>
        </section>
      )}

      <AudioRecorder level={level} translations={translations} />
    </div>
  )
}
