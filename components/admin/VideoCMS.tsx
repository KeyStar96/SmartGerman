'use client'

import { useState } from 'react'
import { addVideo, deleteVideo } from '@/app/actions/cms'
import { Trash2, Plus, Loader2, PlaySquare } from 'lucide-react'

export default function VideoCMS({ initialData }: { initialData: any[] }) {
  const [items, setItems] = useState(initialData)
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    lesson: '',
    video_url: '',
    is_external: false,
    external_url: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await addVideo(form)
    if (res.success) {
      alert('Video hinzugefügt!')
      window.location.reload()
    } else {
      alert('Fehler: ' + res.error)
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Wirklich löschen?')) return
    setDeletingId(id)
    const res = await deleteVideo(id)
    if (res.success) {
      setItems(items.filter(i => i.id !== id))
    } else {
      alert('Fehler: ' + res.error)
    }
    setDeletingId(null)
  }

  return (
    <div className="space-y-8">
      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Neues Video anlegen</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input required placeholder="Titel des Videos" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800" />
          <input required placeholder="Lektion (z.B. A1.1)" value={form.lesson} onChange={e => setForm({...form, lesson: e.target.value})} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800" />
          <input placeholder="Beschreibung (optional)" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 md:col-span-2" />
          
          <div className="flex items-center gap-2 p-3 border border-slate-200 dark:border-slate-700 rounded-xl">
            <input type="checkbox" id="ext" checked={form.is_external} onChange={e => setForm({...form, is_external: e.target.checked})} className="w-5 h-5 rounded border-slate-300 text-[#FF5C00] focus:ring-[#FF5C00]" />
            <label htmlFor="ext" className="text-sm font-bold text-slate-700 dark:text-slate-300">Ist externes YouTube Video?</label>
          </div>
          
          {form.is_external ? (
            <input placeholder="YouTube Video URL" value={form.external_url} onChange={e => setForm({...form, external_url: e.target.value})} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800" />
          ) : (
             <input placeholder="Interne Video URL (aus Storage)" value={form.video_url} onChange={e => setForm({...form, video_url: e.target.value})} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800" />
          )}
        </div>
        <button disabled={loading} type="submit" className="mt-6 flex items-center justify-center gap-2 bg-[#FF5C00] text-white px-6 py-3 rounded-xl font-bold w-full md:w-auto hover:bg-[#e05200] transition-colors disabled:opacity-50">
          {loading ? <Loader2 className="animate-spin" /> : <Plus />}
          Speichern
        </button>
      </form>

      {/* List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-sm">
              <th className="p-4 font-bold">Video</th>
              <th className="p-4 font-bold">Lektion</th>
              <th className="p-4 font-bold">Typ</th>
              <th className="p-4 font-bold text-right">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                <td className="p-4">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <PlaySquare size={16} className="text-[#FF5C00]" />
                    {item.title}
                  </div>
                  <div className="text-sm text-slate-500 truncate max-w-xs">{item.description}</div>
                </td>
                <td className="p-4 text-slate-500">{item.lesson}</td>
                <td className="p-4 text-slate-500 text-sm">
                  {item.is_external ? <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full font-bold text-xs">YouTube</span> : <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-bold text-xs">Intern</span>}
                </td>
                <td className="p-4 text-right">
                  <button onClick={() => handleDelete(item.id)} disabled={deletingId === item.id} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                    {deletingId === item.id ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
