import { getVideos } from '@/app/actions/cms'
import VideoCMS from '@/components/admin/VideoCMS'

export default async function AdminVideosPage() {
  const items = await getVideos()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Videos verwalten</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Lege hier neue Video-Lektionen an oder verknüpfe YouTube-Links.
        </p>
      </div>

      <VideoCMS initialData={items} />
    </div>
  )
}
