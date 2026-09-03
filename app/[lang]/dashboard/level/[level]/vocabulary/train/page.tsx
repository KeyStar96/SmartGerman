import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getDueCards } from '@/app/actions/vocabulary'
import { getDictionary } from '@/lib/dictionary'
import { createVocabularyTranslator, type VocabularyTranslations } from '@/lib/vocabulary-i18n'
import VocabTrainerClient from './VocabTrainerClient'

export default async function VocabTrainPage({
  params,
}: {
  params: Promise<{ lang: string; level: string }>
}) {
  const { lang, level } = await params
  const decodedLevel = decodeURIComponent(level)
  const dict = await getDictionary(lang)
  const translations = (dict.vocabulary ?? {}) as VocabularyTranslations
  const t = createVocabularyTranslator(translations)

  const dueCards = await getDueCards(decodedLevel)

  return (
    <div className="flex min-h-[80vh] flex-col lg:h-[calc(100vh-5rem)] lg:overflow-hidden">
      <div className="mb-4 shrink-0">
        <Link
          href={`/${lang}/dashboard/level/${encodeURIComponent(decodedLevel)}/vocabulary`}
          className="inline-flex min-h-12 items-center gap-2 text-lg font-medium text-blue-600 transition-colors hover:text-blue-800"
        >
          <ArrowLeft size={24} aria-hidden="true" /> {t('back_to_overview')}
        </Link>
      </div>

      {/* Scrollt intern, falls die Karte (Bild + Text) auf kleinen Laptop-Bildschirmen nicht ganz passt. */}
      <div className="min-h-0 flex-1 lg:overflow-y-auto">
        <VocabTrainerClient
          initialCards={dueCards}
          translations={translations}
          lang={lang}
          level={decodedLevel}
        />
      </div>
    </div>
  )
}
