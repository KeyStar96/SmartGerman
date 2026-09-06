import { getDueCards, getLessonStats } from '@/app/actions/vocabulary'
import { getDictionary } from '@/lib/dictionary'
import { type VocabularyTranslations } from '@/lib/vocabulary-i18n'
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

  const [dueCards, lessonStats] = await Promise.all([
    getDueCards(decodedLevel),
    getLessonStats(decodedLevel),
  ])

  /*
    Navigation UND Layout liegen bewusst im Client: Nur dort ist bekannt, ob
    gerade der Lernkasten zusammengestellt (`compose`) oder aktiv gelernt wird
    (`train`). So kann der aktive Lernmodus eine kompakte, vertikal zentrierte
    100dvh-Ansicht ohne Scrollen rendern, während die Zusammenstellung ihre
    gewohnte, scrollbare Übersicht behält.
  */
  return (
    <VocabTrainerClient
      initialCards={dueCards}
      lessonStats={lessonStats}
      translations={translations}
      lang={lang}
      level={decodedLevel}
    />
  )
}
