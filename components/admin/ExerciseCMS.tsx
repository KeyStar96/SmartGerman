'use client'

import { useState } from 'react'
import { addExercise, deleteExercise } from '@/app/actions/cms'
import { Trash2, Plus, Loader2, BookOpen } from 'lucide-react'

export default function ExerciseCMS({ initialData }: { initialData: any[] }) {
  const [items, setItems] = useState(initialData)
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  
  const [form, setForm] = useState({
    level: 'A1.1',
    lesson: '',
    topic: '',
    type: 'fill_in_blank',
    hint_ru: '',
    hint_tr: ''
  })

  // Spezifische States für die Übungstypen (benutzerfreundlich)
  const [fillInBlank, setFillInBlank] = useState({ text_before: '', text_after: '', correct_answer: '' })
  const [multipleChoice, setMultipleChoice] = useState({ question: '', options: '', correct_answer: '' })
  const [sentenceBuilding, setSentenceBuilding] = useState({ parts: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    let content = {}
    
    if (form.type === 'fill_in_blank') {
      if (!fillInBlank.correct_answer) {
        alert('Bitte die korrekte Antwort angeben!')
        setLoading(false)
        return
      }
      content = {
        text_before: fillInBlank.text_before,
        text_after: fillInBlank.text_after,
        correct_answer: fillInBlank.correct_answer
      }
    } else if (form.type === 'multiple_choice') {
      if (!multipleChoice.question || !multipleChoice.options || !multipleChoice.correct_answer) {
        alert('Bitte alle Felder für Multiple Choice ausfüllen!')
        setLoading(false)
        return
      }
      content = {
        question: multipleChoice.question,
        options: multipleChoice.options.split(',').map(s => s.trim()).filter(Boolean),
        correct_answer: multipleChoice.correct_answer.trim()
      }
    } else if (form.type === 'sentence_building') {
      if (!sentenceBuilding.parts) {
        alert('Bitte die Satzteile angeben!')
        setLoading(false)
        return
      }
      content = {
        parts: sentenceBuilding.parts.split(',').map(s => s.trim()).filter(Boolean)
      }
    }

    const payload = { ...form, content }
    const res = await addExercise(payload)
    
    if (res.success) {
      alert('Übung erfolgreich hinzugefügt!')
      window.location.reload()
    } else {
      alert('Fehler: ' + res.error)
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Möchtest du diese Übung wirklich löschen?')) return
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
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Neue Übung anlegen</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Sprachniveau (Level)</label>
            <div className="relative">
              <select value={form.level} onChange={e => setForm({...form, level: e.target.value})} className="appearance-none w-full p-3 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF5C00] cursor-pointer font-bold">
                <option value="A1.1">A1.1</option>
                <option value="A1.2">A1.2</option>
                <option value="A2.1">A2.1</option>
                <option value="A2.2">A2.2</option>
                <option value="B1.1">B1.1</option>
                <option value="B1.2">B1.2</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Lektion</label>
            <input required placeholder="z.B. Lektion 1" value={form.lesson} onChange={e => setForm({...form, lesson: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF5C00]" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Thema</label>
            <input required placeholder="z.B. Perfekt" value={form.topic} onChange={e => setForm({...form, topic: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF5C00]" />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Übungstyp</label>
            <div className="relative">
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="appearance-none w-full p-3 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF5C00] cursor-pointer">
                <option value="fill_in_blank">Lückentext</option>
                <option value="multiple_choice">Multiple Choice</option>
                <option value="sentence_building">Satzbau</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-4">
            <h4 className="font-bold text-slate-700 dark:text-slate-300">Übungsinhalte ({form.type === 'fill_in_blank' ? 'Lückentext' : form.type === 'multiple_choice' ? 'Multiple Choice' : 'Satzbau'})</h4>
            
            {form.type === 'fill_in_blank' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Text davor</label>
                  <input placeholder="Ich " value={fillInBlank.text_before} onChange={e => setFillInBlank({...fillInBlank, text_before: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF5C00]" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#FF5C00] mb-1">Die Lücke (Lösung)</label>
                  <input required placeholder="bin" value={fillInBlank.correct_answer} onChange={e => setFillInBlank({...fillInBlank, correct_answer: e.target.value})} className="w-full p-3 rounded-xl border border-[#FF5C00]/50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF5C00]" />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Text danach</label>
                  <input placeholder=" Nico." value={fillInBlank.text_after} onChange={e => setFillInBlank({...fillInBlank, text_after: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF5C00]" />
                </div>
              </div>
            )}

            {form.type === 'multiple_choice' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Frage / Satz</label>
                  <input required placeholder="Welcher Artikel passt zu 'Mädchen'?" value={multipleChoice.question} onChange={e => setMultipleChoice({...multipleChoice, question: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF5C00]" />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Antwortmöglichkeiten (kommagetrennt)</label>
                  <input required placeholder="der, die, das" value={multipleChoice.options} onChange={e => setMultipleChoice({...multipleChoice, options: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF5C00]" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#FF5C00] mb-1">Richtige Antwort (exakt wie oben)</label>
                  <input required placeholder="das" value={multipleChoice.correct_answer} onChange={e => setMultipleChoice({...multipleChoice, correct_answer: e.target.value})} className="w-full p-3 rounded-xl border border-[#FF5C00]/50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF5C00]" />
                </div>
              </div>
            )}

            {form.type === 'sentence_building' && (
              <div>
                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Satzteile in der richtigen Reihenfolge (kommagetrennt)</label>
                <input required placeholder="Ich, habe, einen, Apfel, gegessen." value={sentenceBuilding.parts} onChange={e => setSentenceBuilding({...sentenceBuilding, parts: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF5C00]" />
                <p className="text-xs text-slate-500 mt-2">Die Wörter werden für den Schüler automatisch gemischt. Die eingegebene Reihenfolge ist die Lösung.</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Hinweis (Russisch, optional)</label>
            <textarea rows={3} placeholder="Warum ist das schwer für Russisch-Muttersprachler?" value={form.hint_ru} onChange={e => setForm({...form, hint_ru: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF5C00]" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Hinweis (Türkisch, optional)</label>
            <textarea rows={3} placeholder="Warum ist das schwer für Türkisch-Muttersprachler?" value={form.hint_tr} onChange={e => setForm({...form, hint_tr: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF5C00]" />
          </div>
        </div>
        <button disabled={loading} type="submit" className="mt-6 flex items-center justify-center gap-2 bg-[#FF5C00] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#e05200] transition-colors disabled:opacity-50">
          {loading ? <Loader2 className="animate-spin" /> : <Plus />}
          Übung speichern
        </button>
      </form>

      {/* List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-sm">
                <th className="p-4 font-bold border-b border-slate-200 dark:border-slate-800">Lektion & Thema</th>
                <th className="p-4 font-bold border-b border-slate-200 dark:border-slate-800">Typ</th>
                <th className="p-4 font-bold border-b border-slate-200 dark:border-slate-800">Inhalt (JSON Preview)</th>
                <th className="p-4 font-bold border-b border-slate-200 dark:border-slate-800 text-right">Aktion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <BookOpen size={16} className="text-[#FF5C00]" />
                      <span className="bg-[#FF5C00] text-white px-2 py-0.5 rounded text-xs">{item.level}</span>
                      {item.topic}
                    </div>
                    <div className="text-sm text-slate-500 mt-1">Lektion: {item.lesson}</div>
                  </td>
                  <td className="p-4">
                    <span className="inline-block bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 px-3 py-1.5 rounded-lg text-xs font-bold">
                      {item.type === 'fill_in_blank' ? 'Lückentext' : item.type === 'multiple_choice' ? 'Multiple Choice' : 'Satzbau'}
                    </span>
                  </td>
                  <td className="p-4 text-slate-500 text-xs font-mono max-w-xs truncate">
                    {JSON.stringify(item.content)}
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleDelete(item.id)} disabled={deletingId === item.id} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors inline-flex items-center justify-center">
                      {deletingId === item.id ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} />}
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    Noch keine Übungen vorhanden.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

