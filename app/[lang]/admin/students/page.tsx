import { getStudents, getAllStudentsProgressData } from '@/app/actions/admin'
import StudentList from '@/components/admin/StudentList'
import { createClient } from '@/utils/supabase/server'

export default async function AdminStudentsPage() {
  const students = await getStudents()
  const progressData = await getAllStudentsProgressData()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = user ? await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single() : { data: null }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Nutzerverwaltung</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Verwalte alle registrierten Schüler, deren Abonnements und Zugriffsrechte (Rollen).
        </p>
      </div>

      <StudentList 
        initialStudents={students} 
        currentUserId={user?.id} 
        currentUserRole={profile?.role}
        progressData={progressData} 
      />
    </div>
  )
}
