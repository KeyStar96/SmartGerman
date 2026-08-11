import { getVocabs } from '@/app/actions/cms'
import VocabCMS from '@/components/admin/VocabCMS'

export default async function AdminVocabularyPage() {
  const items = await getVocabs()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Vokabeln verwalten</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Lege hier neue Vokabelkarten an oder lösche bestehende.
        </p>
      </div>

      <VocabCMS initialData={items} />
    </div>
  )
}
