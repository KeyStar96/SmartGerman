'use client'

import { useState, useEffect } from 'react'
import { getDueCards, submitAnswer } from '@/app/actions/vocabulary'
import { Volume2, Check, X, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function VocabTrainerClient({ initialCards, lang }: { initialCards: any[], lang: string }) {
  const [cards, setCards] = useState(initialCards)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isRevealed, setIsRevealed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const currentCard = cards[currentIndex]

  const handleReveal = () => setIsRevealed(true)

  const handleAnswer = async (isCorrect: boolean) => {
    if (isSubmitting || !currentCard) return
    setIsSubmitting(true)

    // Answer card via Server Action
    const { card, nativeLanguage, progressId } = currentCard
    await submitAnswer(
      progressId,
      isCorrect,
      nativeLanguage,
      card.is_hard_for_ru,
      card.is_hard_for_tr
    )

    // Move to next card
    setIsRevealed(false)
    setCurrentIndex(prev => prev + 1)
    setIsSubmitting(false)
  }

  const playAudio = () => {
    if (!currentCard) return
    const { card } = currentCard

    if (card.audio_url) {
      const audio = new Audio(card.audio_url)
      audio.play().catch(e => console.error("Audio play failed:", e))
    } else {
      // Fallback: Web Speech API
      const utterance = new SpeechSynthesisUtterance(card.word_de)
      utterance.lang = 'de-DE'
      utterance.rate = 0.9 // Etwas langsamer für Lernende
      window.speechSynthesis.speak(utterance)
    }
  }

  if (cards.length === 0 || currentIndex >= cards.length) {
    return (
      <div className="rounded-2xl bg-white p-12 shadow-sm ring-1 ring-gray-900/5 text-center max-w-2xl mx-auto mt-10">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 mb-6">
          <Check className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Fantastisch!</h2>
        <p className="text-xl text-gray-600 mb-8">
          Du hast alle fälligen Vokabeln für heute gelernt.
        </p>
        <Link 
          href={`/${lang}/dashboard/vocabulary`}
          className="rounded-lg bg-blue-600 px-8 py-4 text-xl font-bold text-white shadow-md hover:bg-blue-500 transition-all"
        >
          Zurück zur Übersicht
        </Link>
      </div>
    )
  }

  const { card, nativeLanguage } = currentCard

  // Artikel-Farben für visuelle Hilfestellung
  const getArticleColor = (article: string) => {
    switch (article) {
      case 'der': return 'text-blue-600'
      case 'die': return 'text-red-600'
      case 'das': return 'text-green-600'
      default: return 'text-gray-900'
    }
  }

  // Korrekte Übersetzung basierend auf der Muttersprache anzeigen
  const getTranslation = () => {
    if (nativeLanguage === 'Russisch' && card.translation_ru) return card.translation_ru
    if (nativeLanguage === 'Türkisch' && card.translation_tr) return card.translation_tr
    if (card.translation_en) return card.translation_en // Fallback 1
    return card.translation_ru || card.translation_tr // Fallback 2
  }

  return (
    <div className="max-w-2xl mx-auto mt-6">
      <div className="mb-6 flex justify-between items-center text-gray-500 text-lg font-medium">
        <span>Lektion: {card.lesson}</span>
        <span>Karte {currentIndex + 1} von {cards.length}</span>
      </div>

      {/* Karteikarte */}
      <div className="rounded-3xl bg-white shadow-xl ring-1 ring-gray-900/10 overflow-hidden min-h-[400px] flex flex-col transition-all duration-300">
        
        {/* Vorderseite (Frage / Muttersprache) */}
        <div className="p-10 flex-1 flex flex-col items-center justify-center bg-gray-50 border-b border-gray-100">
          {card.image_url ? (
            <img src={card.image_url} alt="Vokabelbild" className="w-48 h-48 object-cover rounded-xl shadow-md mb-8" />
          ) : (
             <div className="w-32 h-32 bg-gray-200 rounded-xl mb-8 flex items-center justify-center text-gray-400 shadow-inner">
               <ImageIcon size={48} />
             </div>
          )}
          
          <h2 className="text-4xl font-bold text-gray-800 text-center">
            {getTranslation()}
          </h2>
        </div>

        {/* Rückseite (Antwort / Deutsch) */}
        {isRevealed ? (
          <div className="p-10 flex flex-col items-center justify-center bg-white animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 mb-4">
              <span className={`text-5xl font-extrabold ${getArticleColor(card.article)}`}>
                {card.article !== 'none' ? `${card.article} ` : ''}{card.word_de}
              </span>
              <button 
                onClick={playAudio}
                className="p-3 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors shadow-sm"
                aria-label="Vokabel anhören"
              >
                <Volume2 size={32} />
              </button>
            </div>
            
            {card.plural && (
              <p className="text-2xl text-gray-500 mt-2">Plural: {card.plural}</p>
            )}

            <div className="flex w-full gap-6 mt-12">
              <button
                onClick={() => handleAnswer(false)}
                disabled={isSubmitting}
                className="flex-1 flex flex-col items-center justify-center py-6 rounded-2xl bg-red-50 text-red-700 border-2 border-red-200 hover:bg-red-100 hover:border-red-300 transition-all shadow-sm"
              >
                <X size={40} className="mb-2" />
                <span className="text-xl font-bold">Wusste ich NICHT</span>
                <span className="text-sm opacity-80 mt-1">Zurück in Fach 1</span>
              </button>
              
              <button
                onClick={() => handleAnswer(true)}
                disabled={isSubmitting}
                className="flex-1 flex flex-col items-center justify-center py-6 rounded-2xl bg-green-50 text-green-700 border-2 border-green-200 hover:bg-green-100 hover:border-green-300 transition-all shadow-sm"
              >
                <Check size={40} className="mb-2" />
                <span className="text-xl font-bold">Wusste ich</span>
                <span className="text-sm opacity-80 mt-1">Ein Fach weiter</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-10 flex items-center justify-center bg-white">
            <button 
              onClick={handleReveal}
              className="w-full py-8 rounded-2xl bg-blue-600 text-white text-2xl font-bold shadow-md hover:bg-blue-500 hover:shadow-lg transition-all"
            >
              Lösung aufdecken
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
