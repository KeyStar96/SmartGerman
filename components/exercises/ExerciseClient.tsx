'use client'

import { useState } from 'react'
import { saveExerciseProgress } from '@/app/actions/exercises'
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react'

type Exercise = {
  id: string
  lesson: string
  topic: string
  type: string
  content: any
  hint: string | null
  completed: boolean
}

export default function ExerciseClient({ exercises }: { exercises: Exercise[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  if (exercises.length === 0) {
    return (
      <div className="bg-white p-12 rounded-2xl shadow-sm text-center">
        <p className="text-xl text-gray-500">Keine Übungen verfügbar.</p>
      </div>
    )
  }

  if (currentIndex >= exercises.length) {
    return (
      <div className="bg-white p-12 rounded-2xl shadow-sm text-center border-2 border-green-200 bg-green-50">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-green-800 mb-2">Großartig!</h2>
        <p className="text-xl text-green-700">Du hast alle Übungen für heute abgeschlossen.</p>
      </div>
    )
  }

  const exercise = exercises[currentIndex]

  const handleSubmit = async () => {
    if (!selectedAnswer) return
    
    const correct = selectedAnswer === exercise.content.correct_answer
    setIsCorrect(correct)
    setIsSubmitted(true)
    
    // Save progress
    await saveExerciseProgress(exercise.id, correct)
  }

  const handleNext = () => {
    setSelectedAnswer(null)
    setIsSubmitted(false)
    setCurrentIndex(prev => prev + 1)
  }

  return (
    <div className="bg-white rounded-3xl shadow-lg ring-1 ring-gray-900/5 overflow-hidden transition-all duration-300">
      <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
        <span className="text-lg font-medium opacity-80">{exercise.lesson} • {exercise.topic}</span>
        <span className="text-lg font-bold">Übung {currentIndex + 1} von {exercises.length}</span>
      </div>

      <div className="p-8 sm:p-12">
        {exercise.type === 'multiple_choice' && (
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-8">{exercise.content.question}</h3>
            <div className="space-y-4">
              {exercise.content.options.map((option: string) => (
                <button
                  key={option}
                  onClick={() => !isSubmitted && setSelectedAnswer(option)}
                  disabled={isSubmitted}
                  className={`w-full text-left px-6 py-4 rounded-xl border-2 text-xl font-medium transition-all ${
                    selectedAnswer === option 
                      ? 'border-blue-600 bg-blue-50 text-blue-800' 
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  } ${
                    isSubmitted && option === exercise.content.correct_answer 
                      ? '!border-green-500 !bg-green-50 !text-green-800' 
                      : ''
                  } ${
                    isSubmitted && selectedAnswer === option && !isCorrect 
                      ? '!border-red-500 !bg-red-50 !text-red-800' 
                      : ''
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {exercise.type === 'fill_in_blank' && (
          <div>
            <div className="text-3xl leading-relaxed text-gray-800 font-medium mb-12 text-center">
              {exercise.content.text_before}
              <input
                key={exercise.id}
                type="text"
                value={selectedAnswer || ''}
                onChange={(e) => setSelectedAnswer(e.target.value)}
                disabled={isSubmitted}
                className={`mx-3 px-4 py-2 border-b-4 focus:outline-none transition-colors text-center min-w-[240px] ${
                  isSubmitted 
                    ? isCorrect ? 'border-green-500 text-green-700 bg-green-50' : 'border-red-500 text-red-700 bg-red-50'
                    : 'border-gray-300 focus:border-blue-500 bg-gray-50'
                }`}
                placeholder="Lücke ausfüllen"
                autoComplete="off"
                spellCheck="false"
                autoCorrect="off"
              />
              {exercise.content.text_after}
            </div>
          </div>
        )}

        {/* Kontrastiver Grammatik-Hinweis bei Fehler */}
        {isSubmitted && !isCorrect && exercise.hint && (
          <div className="mt-8 bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-xl flex gap-4 items-start animate-in fade-in slide-in-from-bottom-4">
            <AlertCircle className="w-8 h-8 text-amber-600 shrink-0 mt-1" />
            <div>
              <h4 className="text-xl font-bold text-amber-900 mb-2">Tipp für deine Muttersprache</h4>
              <p className="text-lg text-amber-800">{exercise.hint}</p>
            </div>
          </div>
        )}

        {isSubmitted && isCorrect && (
           <div className="mt-8 bg-green-50 border border-green-200 p-6 rounded-xl flex gap-4 items-center animate-in fade-in zoom-in-95">
             <CheckCircle2 className="w-8 h-8 text-green-600 shrink-0" />
             <h4 className="text-xl font-bold text-green-800">Richtig! Gut gemacht.</h4>
           </div>
        )}

        <div className="mt-12 flex justify-end">
          {!isSubmitted ? (
            <button
              onClick={handleSubmit}
              disabled={!selectedAnswer}
              className="px-8 py-4 bg-blue-600 text-white text-xl font-bold rounded-xl hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
            >
              Antwort prüfen
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-8 py-4 bg-gray-900 text-white text-xl font-bold rounded-xl hover:bg-gray-800 transition-all shadow-md"
            >
              Nächste Übung
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
