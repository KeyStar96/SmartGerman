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
    <div className="flex min-h-screen w-full flex-col py-8">
      <div className="mb-4">
        <Link
          href={`/${lang}/dashboard/level/${encodeURIComponent(decodedLevel)}/vocabulary`}
          className="inline-flex min-h-12 items-center gap-2 text-lg font-medium text-blue-600 transition-colors hover:text-blue-800"
        >
          <ArrowLeft size={24} aria-hidden="true" /> {t('back_to_overview')}
        </Link>
      </div>

      {/*
        Zentriert die Karteikarte im verbleibenden, sichtbaren Bereich – über
        `min-h-` statt einer festen `h-[calc(100vh-...)]`: Passt die Karte
        (Bild + Buttons) nicht komplett auf kleinere Laptop-Displays, wächst
        der Container einfach mit und die Seite scrollt ganz natürlich per
        Mausrad/Trackpad, statt unten abgeschnitten zu werden.
      */}
      <div className="flex flex-1 items-center justify-center py-4">
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
