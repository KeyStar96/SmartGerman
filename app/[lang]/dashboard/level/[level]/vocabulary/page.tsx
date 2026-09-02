import Link from 'next/link'
import { ArrowLeft, BookOpenCheck } from 'lucide-react'
import { getDueCards, getLessonStats, initializeLesson } from '@/app/actions/vocabulary'
import { getDictionary } from '@/lib/dictionary'
import { createVocabularyTranslator, type VocabularyTranslations } from '@/lib/vocabulary-i18n'

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
    <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-sm ring-1 ring-gray-900/5">
      <Link
        href={`/${lang}/dashboard/level/${levelSegment}`}
        className="mb-4 inline-flex min-h-12 items-center gap-2 text-lg font-medium text-blue-600 transition-colors hover:text-blue-800"
      >
        <ArrowLeft size={24} aria-hidden="true" /> {t('back_to_level')}
      </Link>

      <div className="mb-8 flex flex-col justify-between gap-6 border-b border-gray-200 pb-6 md:flex-row md:items-center">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900">{t('title')}</h1>
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
        <div className="space-y-4">
          {stats.map((stat) => {
            const learnedPercent = stat.total > 0 ? Math.round((stat.learned / stat.total) * 100) : 0
            const isUnstarted = stat.active === 0 && stat.learned === 0

            return (
              <div
                key={stat.lesson}
                className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md md:flex-row md:items-center"
              >
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{stat.lesson}</h3>
                  <div className="mt-2 flex flex-wrap gap-4 text-lg text-gray-600">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-blue-500" aria-hidden="true" />
                      {stat.active} {t('in_training')}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-green-500" aria-hidden="true" />
                      {stat.learned} {t('learned')}
                    </span>
                    {stat.due > 0 && (
                      <span className="inline-flex items-center gap-2 font-bold text-amber-700">
                        <span className="h-3 w-3 rounded-full bg-amber-500" aria-hidden="true" />
                        {stat.due} {t('due_now')}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-gray-300" aria-hidden="true" />
                      {stat.total} {t('total')}
                    </span>
                  </div>
                </div>

                {isUnstarted ? (
                  <form
                    action={async () => {
                      'use server'
                      await initializeLesson(stat.lesson, decodedLevel)
                    }}
                  >
                    <button
                      type="submit"
                      className="min-h-14 rounded-2xl bg-green-600 px-8 py-4 text-lg font-bold text-white shadow-sm transition-colors hover:bg-green-500 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00]"
                    >
                      {t('start_set')}
                    </button>
                  </form>
                ) : (
                  <div
                    className="h-4 w-full overflow-hidden rounded-full bg-gray-200 shadow-inner md:w-48"
                    role="progressbar"
                    aria-valuenow={learnedPercent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={t('learned')}
                  >
                    <div
                      className="h-4 rounded-full bg-green-500 transition-all duration-500"
                      style={{ width: `${learnedPercent}%` }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
