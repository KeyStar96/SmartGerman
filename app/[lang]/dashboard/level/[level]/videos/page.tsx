import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { PlayCircle, ExternalLink, Clock } from 'lucide-react'

export default async function VideosOverviewPage({
  params,
}: {
  params: Promise<{ lang: string, level: string }>
}) {
  const { lang, level } = await params
  const decodedLevel = decodeURIComponent(level)
  const supabase = await createClient()

  const { data: videos } = await supabase
    .from('videos')
    .select('*')
    .eq('level', decodedLevel)
    .order('created_at', { ascending: true })

  if (!videos) return null

  const internalVideos = videos.filter(v => !v.is_external)
  const externalVideos = videos.filter(v => v.is_external)

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="bg-white rounded-2xl p-8 shadow-sm ring-1 ring-gray-900/5">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">SmartGerman Lektionen</h1>
        <p className="text-lg text-gray-600 mb-8">
          Unsere eigenen, passgenauen Video-Lektionen (In Vorbereitung).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {internalVideos.map(video => (
            <Link 
              key={video.id} 
              href={`/${lang}/dashboard/videos/${video.id}`}
              className="group flex flex-col rounded-xl border border-gray-200 bg-white overflow-hidden hover:shadow-md transition-all"
            >
              <div className="aspect-video bg-gray-100 flex items-center justify-center relative">
                <PlayCircle className="w-16 h-16 text-gray-400 group-hover:text-blue-500 transition-colors" />
                {!video.video_url && (
                  <span className="absolute top-4 right-4 bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                    Demnächst
                  </span>
                )}
              </div>
              <div className="p-6">
                <div className="text-sm font-semibold text-blue-600 mb-1">{video.lesson}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{video.title}</h3>
                <p className="text-gray-600">{video.description}</p>
              </div>
            </Link>
          ))}
          {internalVideos.length === 0 && (
            <div className="col-span-2 text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              Noch keine Videos verfügbar.
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 rounded-2xl p-8 shadow-sm ring-1 ring-blue-900/5">
        <div className="flex items-center gap-3 mb-2">
          <h2 className="text-2xl font-bold text-blue-900">Nicos Weg (Deutsche Welle)</h2>
          <span className="bg-blue-200 text-blue-800 text-xs font-bold px-2 py-1 rounded">Externes Angebot</span>
        </div>
        <p className="text-lg text-blue-800/80 mb-8">
          Die perfekte Ergänzung zu unserem Kurs. Ein interaktiver Videokurs der Deutschen Welle.
        </p>

        <div className="space-y-4">
          {externalVideos.map(video => (
            <a 
              key={video.id}
              href={video.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-blue-100 group"
            >
              <div>
                <div className="text-sm font-semibold text-blue-600 mb-1">{video.lesson}</div>
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{video.title}</h3>
                <p className="text-gray-600 mt-1">{video.description}</p>
              </div>
              <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <ExternalLink size={24} />
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
