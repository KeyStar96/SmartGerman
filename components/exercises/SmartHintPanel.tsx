'use client'

import { Lightbulb } from 'lucide-react'
import type { ExerciseTranslator } from '@/lib/exercise-i18n'
import type { SmartHintDescriptor } from '@/lib/types/exercise'

interface SmartHintPanelProps {
  hint: SmartHintDescriptor
  t: ExerciseTranslator
}

function renderHintText(hint: SmartHintDescriptor, t: ExerciseTranslator): string {
  switch (hint.kind) {
    case 'custom':
      return hint.text
    case 'gender':
      return t('hint_gender', { article: hint.article })
    case 'noun':
      return t('hint_noun', { length: hint.length })
    case 'verb':
      return t('hint_verb', { length: hint.length })
    case 'first_letter':
      return t('hint_first_letter', { letter: hint.letter, length: hint.length })
  }
}

/**
 * Dezenter Hinweis nach zwei Fehlversuchen. Bewusst ruhig gestaltet: kein Rot,
 * keine Fehlermetaphorik – der Hinweis ist eine Hilfe, keine Bewertung.
 */
export default function SmartHintPanel({ hint, t }: SmartHintPanelProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="mt-8 flex items-start gap-4 rounded-2xl border-2 border-sky-200 bg-sky-50 p-6"
    >
      <Lightbulb className="mt-1 h-8 w-8 shrink-0 text-sky-600" aria-hidden="true" />
      <div>
        <h4 className="mb-1 text-xl font-bold text-sky-900">{t('hint_title')}</h4>
        <p className="text-xl leading-relaxed text-sky-800">{renderHintText(hint, t)}</p>
      </div>
    </div>
  )
}
