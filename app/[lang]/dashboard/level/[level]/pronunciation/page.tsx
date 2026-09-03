import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getStudentSubmissions } from '@/app/actions/feedback'
import { getDictionary } from '@/lib/dictionary'
import {
  createPronunciationTranslator,
  type PronunciationTranslations,
} from '@/lib/pronunciation-i18n'
import AudioRecorder from '@/components/audio/AudioRecorder'
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

  const submissions = await getStudentSubmissions(decodedLevel)

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10 lg:h-[calc(100vh-5rem)] lg:overflow-hidden">
      {/* Kopf, Hero-Karte und Recorder bleiben auf Desktop fix stehen; nur der Verlauf darunter scrollt. */}
      <div className="shrink-0 space-y-10">
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

        <AudioRecorder level={decodedLevel} translations={translations} />
      </div>

      <div className="min-h-0 flex-1 space-y-6 lg:overflow-y-auto">
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
