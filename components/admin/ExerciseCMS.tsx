'use client'

import { useState } from 'react'
import { addExercise, deleteExercise } from '@/app/actions/cms'
import { Trash2, Plus, Loader2, BookOpen } from 'lucide-react'

export default function ExerciseCMS({ initialData }: { initialData: any[] }) {
  const [items, setItems] = useState(initialData)
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  
  const [form, setForm] = useState({
    lesson: '',
    topic: '',
    type: 'fill_in_blank',
    content: '{}',
    hint_ru: '',
    hint_tr: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    let parsedContent = {}
    try {
      parsedContent = JSON.parse(form.content)
    } catch (err) {
      alert('Der Content muss valides JSON sein!')
      setLoading(false)
      return
    }

    const payload = { ...form, content: parsedContent }
    const res = await addExercise(payload)
    
    if (res.success) {
      alert('Übung hinzugefügt!')
      window.location.reload()
    } else {
      alert('Fehler: ' + res.error)
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Wirklich löschen?')) return
    setDeletingId(id)
    const res = await deleteExercise(id)
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
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Neue Übung anlegen</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input required placeholder="Lektion (z.B. A1.1)" value={form.lesson} onChange={e => setForm({...form, lesson: e.target.value})} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800" />
          <input required placeholder="Thema (z.B. Perfekt)" value={form.topic} onChange={e => setForm({...form, topic: e.target.value})} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800" />
          
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Übungstyp</label>
            <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800">
              <option value="fill_in_blank">Lückentext (fill_in_blank)</option>
              <option value="multiple_choice">Multiple Choice (multiple_choice)</option>
              <option value="sentence_building">Satzbau (sentence_building)</option>
            </select>
          </div>

          <div className="md:col-span-2">
             <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Content (JSON Format)</label>
             <textarea 
               required 
               rows={6}
               placeholder={`{"question": "Das ist ___ Auto.", "answer": "ein", "options": ["ein", "eine"]}`} 
               value={form.content} 
               onChange={e => setForm({...form, content: e.target.value})} 
               className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 font-mono text-sm" 
             />
          </div>

          <input placeholder="Hinweis (RU)" value={form.hint_ru} onChange={e => setForm({...form, hint_ru: e.target.value})} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800" />
          <input placeholder="Hinweis (TR)" value={form.hint_tr} onChange={e => setForm({...form, hint_tr: e.target.value})} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800" />
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
              <th className="p-4 font-bold">Lektion & Thema</th>
              <th className="p-4 font-bold">Typ</th>
              <th className="p-4 font-bold">Content Preview</th>
              <th className="p-4 font-bold text-right">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                <td className="p-4">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <BookOpen size={16} className="text-[#FF5C00]" />
                    {item.topic}
                  </div>
                  <div className="text-sm text-slate-500">Lektion: {item.lesson}</div>
                </td>
                <td className="p-4 text-slate-500 text-sm font-mono">
                  <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg text-xs">{item.type}</span>
                </td>
                <td className="p-4 text-slate-500 text-xs font-mono max-w-xs truncate">
                  {JSON.stringify(item.content)}
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
