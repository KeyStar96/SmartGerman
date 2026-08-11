import { getDueCards } from '@/app/actions/vocabulary'
import VocabTrainerClient from './VocabTrainerClient'
import Link from 'next/link'

export default async function VocabTrainPage({
  params,
}: {
  params: Promise<{ lang: string, level: string }>
}) {
  const { lang, level } = await params
  const decodedLevel = decodeURIComponent(level)
  
  // Fällige Karten vom Server abrufen
  const dueCards = await getDueCards(decodedLevel)

  return (
    <div className="min-h-[80vh] flex flex-col">
      <div className="mb-4">
        <Link 
          href={`/${lang}/dashboard/vocabulary`}
          className="text-blue-600 font-medium hover:text-blue-800 transition-colors inline-flex items-center"
        >
          &larr; Zurück zur Übersicht
        </Link>
      </div>
      
      <div className="flex-1">
        <VocabTrainerClient initialCards={dueCards} lang={lang} />
      </div>
    </div>
  )
}
