'use client'

import { useState } from 'react'
import AudioRecorder from './AudioRecorder'
import { Mic } from 'lucide-react'

export default function ResubmissionRecorder({ parentId, currentAttempt = 1, level }: { parentId: string, currentAttempt?: number, level?: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-6">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-center gap-2 bg-[#FF5C00] hover:bg-[#e05200] text-white px-4 py-2 rounded-xl font-bold transition-colors w-full sm:w-auto"
        >
          <Mic size={18} /> Zweiten Versuch aufnehmen
        </button>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-slate-900 dark:text-slate-100">Neuer Versuch</h4>
            <button
              onClick={() => setIsOpen(false)}
              className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              Abbrechen
            </button>
          </div>
          <AudioRecorder 
            parentId={parentId} 
            attemptNumber={currentAttempt + 1} 
            level={level}
            compact={true} 
            onSubmitted={() => setIsOpen(false)}
          />
        </div>
      )}
    </div>
  )
}
