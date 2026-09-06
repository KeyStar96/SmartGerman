import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getStudentSubmissions } from '@/app/actions/feedback'
import { getDictionary } from '@/lib/dictionary'
import {
  createPronunciationTranslator,
  type PronunciationTranslations,
} from '@/lib/pronunciation-i18n'
import { getPronunciationPrompts } from '@/app/actions/pronunciation'
import PronunciationPractice from '@/components/audio/PronunciationPractice'
import SubmissionHistory from '@/components/audio/SubmissionHistory'

export default async function PronunciationDashboard({
  params,
}: {
  params: Promise<{ lang: string; level: string }>
}) {
  const { lang, level } = await params
  const decodedLevel = decodeURIComponent(level)
  const dict = await getDictionary(lang)
  const translations = (dict.pronunciation ?? {}) as PronunciationTranslations
  const t = createPronunciationTranslator(translations)

  const [submissions, prompts] = await Promise.all([
    getStudentSubmissions(decodedLevel),
    getPronunciationPrompts(decodedLevel),
  ])

  return (
    <div className="mx-auto min-h-screen w-full max-w-4xl space-y-10 py-8">
      <div>
        <Link
          href={`/${lang}/dashboard/level/${encodeURIComponent(decodedLevel)}`}
          className="inline-flex min-h-12 items-center gap-2 text-lg font-medium text-blue-600 transition-colors hover:text-blue-800"
        >
          <ArrowLeft size={24} aria-hidden="true" /> {t('back_to_level')}
        </Link>
      </div>

      <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-6 text-white shadow-lg sm:p-8 dark:bg-slate-800">
        <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 -translate-y-1/2 translate-x-1/2 rounded-full bg-[#FF5C00] opacity-20 blur-[100px]" />
        <h1 className="relative z-10 mb-4 break-words text-2xl font-bold sm:text-3xl">{t('title')}</h1>
        <p className="relative z-10 text-lg leading-relaxed opacity-90 sm:text-xl">{t('subtitle')}</p>
      </div>

      <PronunciationPractice
        prompts={prompts}
        level={decodedLevel}
        translations={translations}
      />

      {/* Fließt natürlich unter der Aufnahme-Box; die Seite scrollt normal per Mausrad/Trackpad. */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {t('history_title')}
        </h2>

        <SubmissionHistory
          submissions={submissions}
          translations={translations}
          lang={lang}
          level={decodedLevel}
        />
      </div>
    </div>
  )
}
