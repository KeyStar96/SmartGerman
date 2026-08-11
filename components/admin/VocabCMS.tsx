'use client'

import { useState } from 'react'
import { addVocab, deleteVocab } from '@/app/actions/cms'
import { Trash2, Plus, Loader2 } from 'lucide-react'

export default function VocabCMS({ initialData }: { initialData: any[] }) {
  const [items, setItems] = useState(initialData)
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  
  const [form, setForm] = useState({
    lesson: '',
    word_de: '',
    article: 'none',
    plural: '',
    translation_ru: '',
    translation_tr: '',
    translation_en: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await addVocab(form)
    if (res.success) {
      alert('Vokabel hinzugefügt!')
      window.location.reload()
    } else {
      alert('Fehler: ' + res.error)
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Wirklich löschen?')) return
    setDeletingId(id)
    const res = await deleteVocab(id)
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
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Neue Vokabel anlegen</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input required placeholder="Lektion (z.B. A1.1)" value={form.lesson} onChange={e => setForm({...form, lesson: e.target.value})} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800" />
          <input required placeholder="Deutsches Wort" value={form.word_de} onChange={e => setForm({...form, word_de: e.target.value})} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800" />
          <select value={form.article} onChange={e => setForm({...form, article: e.target.value})} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800">
            <option value="none">Kein Artikel</option>
            <option value="der">der</option>
            <option value="die">die</option>
            <option value="das">das</option>
          </select>
          <input placeholder="Plural" value={form.plural} onChange={e => setForm({...form, plural: e.target.value})} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800" />
          <input placeholder="Übersetzung (RU)" value={form.translation_ru} onChange={e => setForm({...form, translation_ru: e.target.value})} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800" />
          <input placeholder="Übersetzung (TR)" value={form.translation_tr} onChange={e => setForm({...form, translation_tr: e.target.value})} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800" />
          <input placeholder="Übersetzung (EN)" value={form.translation_en} onChange={e => setForm({...form, translation_en: e.target.value})} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800" />
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
              <th className="p-4 font-bold">Wort (DE)</th>
              <th className="p-4 font-bold">Lektion</th>
              <th className="p-4 font-bold">Übersetzungen</th>
              <th className="p-4 font-bold text-right">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                <td className="p-4 font-bold text-slate-900 dark:text-white">
                  {item.article !== 'none' ? `${item.article} ` : ''}{item.word_de} {item.plural && `(${item.plural})`}
                </td>
                <td className="p-4 text-slate-500">{item.lesson}</td>
                <td className="p-4 text-slate-500 text-sm">
                  {item.translation_ru && <div>RU: {item.translation_ru}</div>}
                  {item.translation_tr && <div>TR: {item.translation_tr}</div>}
                  {item.translation_en && <div>EN: {item.translation_en}</div>}
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
