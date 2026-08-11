import { getStudents } from '@/app/actions/admin'
import StudentList from '@/components/admin/StudentList'

export default async function AdminStudentsPage() {
  const students = await getStudents()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Nutzerverwaltung</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Verwalte alle registrierten Schüler, deren Abonnements und Zugriffsrechte (Rollen).
        </p>
      </div>

      <StudentList initialStudents={students} />
    </div>
  )
}
