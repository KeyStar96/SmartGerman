import { getPendingSubmissions, getCompletedSubmissions } from '@/app/actions/feedback'
import SubmissionsDashboard from '@/components/admin/SubmissionsDashboard'

export default async function AdminSubmissionsPage() {
  const [pending, completed] = await Promise.all([
    getPendingSubmissions(),
    getCompletedSubmissions()
  ])

  return (
    <SubmissionsDashboard 
      pendingSubmissions={pending || []} 
      completedSubmissions={completed || []} 
    />
  )
}
