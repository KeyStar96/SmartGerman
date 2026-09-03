import Link from 'next/link'
import { ArrowLeft, BookOpenCheck } from 'lucide-react'
import { getDueCards, getLessonStats } from '@/app/actions/vocabulary'
import { getDictionary } from '@/lib/dictionary'
import { createVocabularyTranslator, type VocabularyTranslations } from '@/lib/vocabulary-i18n'
import LessonList from '@/components/vocabulary/LessonList'

export default async function VocabularyOverviewPage({
  params,
}: {
  params: Promise<{ lang: string; level: string }>
}) {
  const { lang, level } = await params
  const decodedLevel = decodeURIComponent(level)
  const dict = await getDictionary(lang)
  const translations = (dict.vocabulary ?? {}) as VocabularyTranslations
  const t = createVocabularyTranslator(translations)

  const [stats, dueCards] = await Promise.all([
    getLessonStats(decodedLevel),
    getDueCards(decodedLevel),
  ])
  const dueCount = dueCards.length
  const levelSegment = encodeURIComponent(decodedLevel)

  return (
    <div className="mx-auto min-h-screen w-full max-w-4xl rounded-3xl bg-white p-5 py-8 shadow-sm ring-1 ring-gray-900/5 sm:p-8">
      <Link
        href={`/${lang}/dashboard/level/${levelSegment}`}
        className="mb-4 inline-flex min-h-12 items-center gap-2 text-lg font-medium text-blue-600 transition-colors hover:text-blue-800"
      >
        <ArrowLeft size={24} aria-hidden="true" /> {t('back_to_level')}
      </Link>

      <div className="mb-8 flex flex-col justify-between gap-6 border-b border-gray-200 pb-6 md:flex-row md:items-center">
        <div>
          <h1 className="break-words text-3xl font-extrabold text-gray-900 sm:text-4xl">{t('title')}</h1>
          <p className="mt-2 text-xl text-gray-600">{t('subtitle')}</p>
        </div>

        <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-6 text-center shadow-sm">
          <div className="text-4xl font-bold text-blue-700">{dueCount}</div>
          <div className="mt-1 text-lg font-medium text-blue-900">{t('due_count')}</div>

          {dueCount > 0 ? (
            <Link
              href={`/${lang}/dashboard/level/${levelSegment}/vocabulary/train`}
              className="mt-4 inline-flex min-h-16 w-full items-center justify-center rounded-2xl bg-blue-600 px-6 py-4 text-xl font-bold text-white shadow-md transition-all hover:bg-blue-500 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00]"
            >
              {t('start_learning')}
            </Link>
          ) : (
            <p className="mt-4 flex min-h-16 w-full items-center justify-center rounded-2xl bg-gray-100 px-6 py-4 text-xl font-bold text-gray-500">
              {t('all_done')}
            </p>
          )}
        </div>
      </div>

      <h2 className="mb-6 text-2xl font-bold text-gray-900">{t('your_sets')}</h2>

      {stats.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 py-12 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
            <BookOpenCheck className="h-10 w-10 text-blue-600" aria-hidden="true" />
          </div>
          <p className="text-xl font-bold text-gray-800">{t('no_sets')}</p>
          <p className="mx-auto mt-2 max-w-md text-lg text-gray-600">{t('no_sets_hint')}</p>
        </div>
      ) : (
        <LessonList stats={stats} lang={lang} level={decodedLevel} translations={translations} />
      )}
    </div>
  )
}
