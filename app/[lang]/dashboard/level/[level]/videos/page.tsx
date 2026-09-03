import Link from 'next/link'
import { ArrowLeft, BookOpenCheck, ExternalLink, PlayCircle } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { getDictionary } from '@/lib/dictionary'
import { createVideoTranslator, type VideoTranslations } from '@/lib/videos-i18n'
import type { Database } from '@/supabase/database.types'

type VideoRow = Database['public']['Tables']['videos']['Row']

export default async function VideosOverviewPage({
  params,
}: {
  params: Promise<{ lang: string; level: string }>
}) {
  const { lang, level } = await params
  const decodedLevel = decodeURIComponent(level)
  const levelSegment = encodeURIComponent(decodedLevel)
  const dict = await getDictionary(lang)
  const t = createVideoTranslator((dict.videos ?? {}) as VideoTranslations)
  const levelHref = `/${lang}/dashboard/level/${levelSegment}`

  let videos: VideoRow[] = []

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('level', decodedLevel)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Videos konnten nicht geladen werden:', error.message)
    } else {
      videos = data ?? []
    }
  } catch (err) {
    console.error('Videos konnten nicht geladen werden:', err)
  }

  const internalVideos = videos.filter((video) => !video.is_external)
  const externalVideos = videos.filter((video) => Boolean(video.is_external && video.external_url))

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10 lg:h-[calc(100vh-5rem)] lg:overflow-hidden">
      <Link
        href={levelHref}
        className="inline-flex min-h-12 shrink-0 items-center gap-2 text-lg font-medium text-blue-600 transition-colors hover:text-blue-800 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00]"
      >
        <ArrowLeft size={24} aria-hidden="true" /> {t('back_to_level')}
      </Link>

      {/* Beide Video-Abschnitte teilen sich einen gemeinsamen internen Scrollbereich, damit die Seite selbst auf Desktop nie scrollen muss. */}
      <div className="min-h-0 flex-1 space-y-10 lg:overflow-y-auto">
      <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-900/5 sm:p-8 dark:bg-slate-900 dark:ring-slate-800">
        <h1 className="mb-2 break-words text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">
          {t('internal_title')}
        </h1>
        <p className="mb-8 text-lg leading-relaxed text-slate-600 dark:text-slate-400">
          {t('internal_subtitle')}
        </p>

        {internalVideos.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 py-12 text-center dark:border-slate-700 dark:bg-slate-800/40">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/40">
              <BookOpenCheck className="h-10 w-10 text-blue-600" aria-hidden="true" />
            </div>
            <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{t('empty_internal')}</p>
            <p className="mx-auto mt-2 max-w-md text-lg text-slate-600 dark:text-slate-400">
              {t('empty_internal_hint')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
            {internalVideos.map((video) => (
              <Link
                key={video.id}
                href={`/${lang}/dashboard/level/${levelSegment}/videos/${video.id}`}
                className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all hover:shadow-md focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00] dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="relative flex aspect-video items-center justify-center bg-slate-100 dark:bg-slate-700">
                  <PlayCircle className="h-16 w-16 text-slate-400 transition-colors group-hover:text-blue-500" aria-hidden="true" />
                  {!video.video_url && (
                    <span className="absolute top-4 right-4 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold tracking-wide text-amber-800 uppercase">
                      {t('coming_soon')}
                    </span>
                  )}
                </div>
                <div className="min-w-0 p-5 sm:p-6">
                  <div className="mb-1 text-sm font-semibold text-blue-600">
                    {t('lesson_label', { lesson: video.lesson })}
                  </div>
                  <h2 className="mb-2 break-words text-xl font-bold text-slate-900 dark:text-white">{video.title}</h2>
                  {video.description ? (
                    <p className="break-words text-slate-600 dark:text-slate-400">{video.description}</p>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl bg-blue-50 p-5 shadow-sm ring-1 ring-blue-900/5 sm:p-8 dark:bg-blue-950/30 dark:ring-blue-900/30">
        <div className="mb-2 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
          <h2 className="break-words text-xl font-bold text-blue-900 sm:text-2xl dark:text-blue-100">
            {t('external_title')}
          </h2>
          <span className="rounded bg-blue-200 px-2 py-1 text-xs font-bold text-blue-800 dark:bg-blue-900 dark:text-blue-100">
            {t('external_badge')}
          </span>
        </div>
        <p className="mb-8 text-lg leading-relaxed text-blue-800/80 dark:text-blue-200/80">
          {t('external_subtitle')}
        </p>

        {externalVideos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-blue-200 bg-white/70 py-10 text-center dark:border-blue-800 dark:bg-slate-900/40">
            <p className="text-lg text-blue-900 dark:text-blue-100">{t('empty_external')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {externalVideos.map((video) => (
              <a
                key={video.id}
                href={video.external_url ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t('open_external_aria', { title: video.title })}
                className="group flex min-h-16 flex-col gap-4 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm transition-all hover:shadow-md focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C00] sm:flex-row sm:items-center sm:justify-between sm:p-6 dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="min-w-0">
                  <div className="mb-1 text-sm font-semibold text-blue-600">
                    {t('lesson_label', { lesson: video.lesson })}
                  </div>
                  <h3 className="break-words text-xl font-bold text-slate-900 transition-colors group-hover:text-blue-700 dark:text-white">
                    {video.title}
                  </h3>
                  {video.description ? (
                    <p className="mt-1 break-words text-slate-600 dark:text-slate-400">{video.description}</p>
                  ) : null}
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white dark:bg-blue-950 dark:text-blue-200">
                  <ExternalLink size={24} aria-hidden="true" />
                </div>
              </a>
            ))}
          </div>
        )}
      </section>
      </div>
    </div>
  )
}
