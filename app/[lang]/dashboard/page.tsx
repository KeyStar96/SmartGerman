import Link from 'next/link'
import { BookOpen, ChevronRight, Trophy, Lock } from 'lucide-react'
import { getAllLevelsProgress } from '@/app/actions/progress'
import { getUnseenFeedbackSummary } from '@/app/actions/feedback'
import { getDictionary } from '@/lib/dictionary'
import { createDashboardTranslator, type DashboardTranslations } from '@/lib/dashboard-i18n'
import type { PronunciationTranslations } from '@/lib/pronunciation-i18n'
import { levelVisual } from '@/lib/vocabulary-ui'
import { createClient } from '@/utils/supabase/server'
import { hasLevelAccess } from '@/lib/access/levels'
import FeedbackNotificationCard from '@/components/dashboard/FeedbackNotificationCard'

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const supabase = await createClient()
  const [{ data: { user } }, progressMap, unseenFeedback, dict] = await Promise.all([
    supabase.auth.getUser(),
    getAllLevelsProgress(),
    getUnseenFeedbackSummary(),
    getDictionary(lang),
  ])

  const { data: accessProfile } = user
    ? await supabase.from('profiles').select('role, allowed_levels').eq('id', user.id).single()
    : { data: null }

  const pronunciationTranslations = (dict.pronunciation ?? {}) as PronunciationTranslations
  const t = createDashboardTranslator((dict.dashboard ?? {}) as DashboardTranslations)

  const LEVELS = [
    { id: 'A1.1', title: dict.dashboard?.level_a11_title || 'A1.1 Anfänger', description: dict.dashboard?.level_a11_desc || '' },
    { id: 'A1.2', title: dict.dashboard?.level_a12_title || 'A1.2 Anfänger', description: dict.dashboard?.level_a12_desc || '' },
    { id: 'A2.1', title: dict.dashboard?.level_a21_title || 'A2.1 Grundlegende Kenntnisse', description: dict.dashboard?.level_a21_desc || '' },
    { id: 'A2.2', title: dict.dashboard?.level_a22_title || 'A2.2 Grundlegende Kenntnisse', description: dict.dashboard?.level_a22_desc || '' },
    { id: 'B1.1', title: dict.dashboard?.level_b11_title || 'B1.1 Fortgeschrittene', description: dict.dashboard?.level_b11_desc || '' },
    { id: 'B1.2', title: dict.dashboard?.level_b12_title || 'B1.2 Fortgeschrittene', description: dict.dashboard?.level_b12_desc || '' },
  ]

  return (
    <div className="space-y-8">
      <div className="mx-auto mb-8 max-w-2xl text-center md:mb-12">
        <h1 className="mb-4 break-words text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl md:text-5xl dark:text-white">
          {t('title_before')}{' '}
          <span className="bg-gradient-to-r from-orange-500 to-[#FF5C00] bg-clip-text text-transparent">
            {t('title_highlight')}
          </span>
        </h1>
        <p className="text-lg leading-relaxed text-slate-600 dark:text-slate-400">
          {t('subtitle')}
        </p>
      </div>

      <FeedbackNotificationCard
        summary={unseenFeedback}
        translations={pronunciationTranslations}
        lang={lang}
      />

      <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        {LEVELS.map((level) => {
          const progress = progressMap[level.id] || 0
          const isStarted = progress > 0
          const isCompleted = progress === 100
          const visual = levelVisual(level.id)
          const isLocked = !hasLevelAccess(accessProfile, level.id)

          // Gesperrtes Niveau: keine Verlinkung, klar erkennbar, aber nicht
          // „ausgegraut-kaputt". Ein Schloss-Badge und ein Hinweis erklären den Zustand.
          if (isLocked) {
            return (
              <div
                key={level.id}
                aria-disabled="true"
                className="relative flex min-h-[12rem] cursor-not-allowed flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white opacity-90 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="absolute top-0 right-0 left-0 z-0 h-32 bg-slate-50 dark:bg-slate-800/50" />

                <div className="relative z-10 flex flex-1 flex-col p-6 pb-5 sm:p-8 sm:pb-6">
                  <div className="mb-5 flex items-start justify-between gap-3 sm:mb-6">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-400 to-slate-500 text-white shadow-lg">
                      <Lock size={26} aria-hidden="true" />
                    </div>

                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-600 ring-1 ring-inset ring-slate-900/5 dark:bg-slate-800 dark:text-slate-300 dark:ring-white/10">
                      <Lock size={14} aria-hidden="true" />
                      {t('level_locked_badge')}
                    </span>
                  </div>

                  <h2 className="mb-3 break-words text-xl font-bold text-slate-700 sm:text-2xl dark:text-slate-200">
                    {level.title}
                  </h2>
                  <p className="mb-6 line-clamp-3 flex-1 text-base leading-relaxed text-slate-500 sm:text-lg dark:text-slate-400">
                    {level.description}
                  </p>

                  <div className="mt-auto flex min-h-12 items-center text-sm font-medium text-slate-500 dark:text-slate-400">
                    {t('level_locked_hint')}
                  </div>
                </div>
              </div>
            )
          }

          return (
            <Link
              key={level.id}
              href={`/${lang}/dashboard/level/${level.id}`}
              className="group relative flex min-h-[12rem] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#FF5C00]/10 active:scale-[0.98] dark:border-slate-800 dark:bg-slate-900"
            >
              <div className={`absolute top-0 right-0 left-0 z-0 h-32 transition-colors ${visual.soft}`} />

              <div className="relative z-10 flex flex-1 flex-col p-6 pb-5 sm:p-8 sm:pb-6">
                <div className="mb-5 flex items-start justify-between gap-3 sm:mb-6">
                  <div
                    className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg ${visual.gradient}`}
                  >
                    {isCompleted ? <Trophy size={28} aria-hidden="true" /> : <BookOpen size={28} aria-hidden="true" />}
                  </div>

                  {/* Klar lesbares Niveau-Badge statt ausgegrauter Riesenzahl. */}
                  <span
                    className={`inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-lg font-extrabold shadow-sm ring-1 ring-inset ring-black/5 backdrop-blur-sm sm:text-xl dark:bg-slate-900/70 dark:ring-white/10 ${visual.text}`}
                  >
                    {level.id}
                  </span>
                </div>

                <h2 className="mb-3 break-words text-xl font-bold text-slate-900 transition-colors group-hover:text-[#FF5C00] sm:text-2xl dark:text-white">
                  {level.title}
                </h2>
                <p className="mb-6 line-clamp-3 flex-1 text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-400">
                  {level.description}
                </p>

                <div className="mt-auto flex min-h-12 items-center justify-between text-sm font-bold">
                  <span
                    className={`inline-flex items-center ${isStarted ? 'text-[#FF5C00]' : 'text-slate-500 group-hover:text-[#FF5C00] dark:text-slate-400'}`}
                  >
                    {isStarted ? t('continue_learning') : t('start')}
                    <ChevronRight size={18} className="ml-1" aria-hidden="true" />
                  </span>

                  {isStarted ? (
                    <span className="tabular-nums text-[#FF5C00]">{progress}%</span>
                  ) : null}
                </div>
              </div>

              <div className="relative z-10 h-2 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                <div
                  className={`h-full bg-gradient-to-r ${visual.bar} transition-all duration-1000 ease-out`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
