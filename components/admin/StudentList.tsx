'use client'

import { useState } from 'react'
import { updateStudentRole, updateStudentSubscription } from '@/app/actions/admin'
import { CheckCircle2, XCircle, Shield, User, Loader2 } from 'lucide-react'

type Profile = {
  id: string
  name: string
  email: string
  role: string
  subscription_status: string
  created_at: string
}

export default function StudentList({ initialStudents }: { initialStudents: Profile[] }) {
  const [students, setStudents] = useState<Profile[]>(initialStudents)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleRoleChange = async (id: string, currentRole: string) => {
    const newRole = currentRole === 'student' ? 'teacher' : 'student'
    if (!confirm(`Möchtest du die Rolle wirklich auf '${newRole}' ändern?`)) return
    
    setLoadingId(id)
    const res = await updateStudentRole(id, newRole)
    if (res.success) {
      setStudents(students.map(s => s.id === id ? { ...s, role: newRole } : s))
    } else {
      alert('Fehler beim Ändern der Rolle: ' + res.error)
    }
    setLoadingId(null)
  }

  const handleSubChange = async (id: string, currentSub: string) => {
    const newSub = currentSub === 'kostenlos' ? 'aktiv' : 'kostenlos'
    if (!confirm(`Möchtest du das Abo wirklich auf '${newSub}' ändern?`)) return

    setLoadingId(id)
    const res = await updateStudentSubscription(id, newSub)
    if (res.success) {
      setStudents(students.map(s => s.id === id ? { ...s, subscription_status: newSub } : s))
    } else {
      alert('Fehler beim Ändern des Abos: ' + res.error)
    }
    setLoadingId(null)
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-sm">
              <th className="p-4 font-bold border-b border-slate-200 dark:border-slate-800">Name & Email</th>
              <th className="p-4 font-bold border-b border-slate-200 dark:border-slate-800">Registriert am</th>
              <th className="p-4 font-bold border-b border-slate-200 dark:border-slate-800">Abo-Status</th>
              <th className="p-4 font-bold border-b border-slate-200 dark:border-slate-800">Rolle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {students.map((student) => (
              <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                <td className="p-4">
                  <div className="font-bold text-slate-900 dark:text-white">{student.name || 'Unbekannt'}</div>
                  <div className="text-sm text-slate-500">{student.email}</div>
                </td>
                <td className="p-4 text-sm text-slate-500">
                  {new Date(student.created_at).toLocaleDateString('de-DE')}
                </td>
                <td className="p-4">
                  <button
                    onClick={() => handleSubChange(student.id, student.subscription_status)}
                    disabled={loadingId === student.id}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-colors border ${
                      student.subscription_status === 'aktiv'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 dark:hover:bg-emerald-500/20'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-700'
                    }`}
                  >
                    {loadingId === student.id ? <Loader2 size={14} className="animate-spin" /> : (student.subscription_status === 'aktiv' ? <CheckCircle2 size={14} /> : <XCircle size={14} />)}
                    {student.subscription_status === 'aktiv' ? 'Premium' : 'Free'}
                  </button>
                </td>
                <td className="p-4">
                  <button
                    onClick={() => handleRoleChange(student.id, student.role)}
                    disabled={loadingId === student.id}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-colors border ${
                      student.role === 'teacher' || student.role === 'admin'
                        ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20 dark:hover:bg-blue-500/20'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-700'
                    }`}
                  >
                    {loadingId === student.id ? <Loader2 size={14} className="animate-spin" /> : (student.role === 'teacher' || student.role === 'admin' ? <Shield size={14} /> : <User size={14} />)}
                    <span className="capitalize">{student.role}</span>
                  </button>
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-500">
                  Keine Nutzer gefunden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
