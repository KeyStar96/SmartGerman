import { getDueCards, getLessonStats } from '@/app/actions/vocabulary'
import { getDictionary } from '@/lib/dictionary'
import { type VocabularyTranslations } from '@/lib/vocabulary-i18n'
import VocabTrainerPageClient from '@/components/vocabulary/VocabTrainerPageClient'

export default async function VocabularyOverviewPage({
  params,
}: {
  params: Promise<{ lang: string; level: string }>
}) {
  const { lang, level } = await params
  const decodedLevel = decodeURIComponent(level)
  const dict = await getDictionary(lang)
  const translations = (dict.vocabulary ?? {}) as VocabularyTranslations

  const [stats, dueCards] = await Promise.all([
    getLessonStats(decodedLevel),
    getDueCards(decodedLevel),
  ])

  return (
    <VocabTrainerPageClient
      initialCards={dueCards}
      lessonStats={stats}
      translations={translations}
      lang={lang}
      level={decodedLevel}
    />
  )
}
