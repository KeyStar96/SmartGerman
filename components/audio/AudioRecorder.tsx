'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { submitAudioUrl } from '@/app/actions/feedback'
import { Mic, Square, Play, UploadCloud, Loader2, CheckCircle2 } from 'lucide-react'

type AudioRecorderProps = {
  parentId?: string;
  attemptNumber?: number;
  onSubmitted?: () => void;
  compact?: boolean;
}

export default function AudioRecorder({ parentId, attemptNumber = 1, onSubmitted, compact = false }: AudioRecorderProps = {}) {
  const [isRecording, setIsRecording] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const isUploadingRef = useRef(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const audioChunks = useRef<Blob[]>([])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorder.current = new MediaRecorder(stream)
      audioChunks.current = []

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data)
      }

      mediaRecorder.current.onstop = () => {
        const mimeType = mediaRecorder.current?.mimeType || 'audio/webm'
        const audioBlob = new Blob(audioChunks.current, { type: mimeType })
        const url = URL.createObjectURL(audioBlob)
        setAudioUrl(url)
        setAudioBlob(audioBlob)
      }

      mediaRecorder.current.start()
      setIsRecording(true)
      setAudioUrl(null)
      setIsSubmitted(false)
    } catch (err) {
      console.error('Fehler beim Zugriff auf das Mikrofon:', err)
      alert('Bitte erlaube den Zugriff auf dein Mikrofon, um aufzunehmen.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop()
      setIsRecording(false)
      // Stop all tracks to release microphone
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop())
    }
  }

  const playAudio = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl)
      audio.play()
    }
  }

  const uploadAndSubmit = async () => {
    if (!audioBlob || isUploadingRef.current) return
    isUploadingRef.current = true
    setIsUploading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')

      const ext = audioBlob.type.includes('mp4') ? 'mp4' : 'webm'
      const fileName = `${user.id}-${Date.now()}.${ext}`
      
      const { data, error } = await supabase.storage
        .from('audio_submissions')
        .upload(fileName, audioBlob, { contentType: audioBlob.type })

      if (error) throw error

      const { data: publicUrlData } = supabase.storage
        .from('audio_submissions')
        .getPublicUrl(fileName)

      const result = await submitAudioUrl(publicUrlData.publicUrl, parentId, attemptNumber)
      if (result.success) {
        setIsSubmitted(true)
        if (onSubmitted) onSubmitted()
      } else {
         throw new Error(result.error)
      }
    } catch (err) {
      console.error('Upload error:', err)
      alert('Es gab einen Fehler beim Hochladen. Bitte versuche es erneut.')
    } finally {
      isUploadingRef.current = false
      setIsUploading(false)
    }
  }

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-md border border-slate-200 dark:border-slate-800 text-center transition-colors ${compact ? 'p-6 shadow-none' : ''}`}>
      {!compact && (
        <>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Deine Aussprache üben</h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
            Nimm dich selbst auf, höre es dir an und reiche es zur Korrektur ein.
          </p>
        </>
      )}

      {/* Recording Indicator */}
      {isRecording && (
        <div className="flex items-center justify-center gap-3 mb-8">
          <span className="relative flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500"></span>
          </span>
          <span className="text-xl font-bold text-red-600 dark:text-red-400">Aufnahme läuft...</span>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-8">
        {!isRecording ? (
          <button 
            onClick={startRecording}
            className="flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-5 rounded-2xl bg-[#FF5C00] text-white text-xl font-bold shadow-lg hover:bg-[#e05200] transition-all"
          >
            <Mic size={28} /> {audioUrl ? 'Neu aufnehmen' : 'Aufnahme starten'}
          </button>
        ) : (
          <button 
            onClick={stopRecording}
            className="flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-5 rounded-2xl bg-slate-900 dark:bg-slate-700 text-white text-xl font-bold shadow-lg hover:bg-slate-800 dark:hover:bg-slate-600 transition-all"
          >
            <Square size={28} /> Stoppen
          </button>
        )}

        {audioUrl && !isRecording && (
          <button 
            onClick={playAudio}
            className="flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            <Play size={28} /> Anhören
          </button>
        )}
      </div>

      {/* Submit */}
      {audioUrl && !isRecording && (
        <div className="border-t border-slate-200 dark:border-slate-800 pt-8 mt-4">
          {isSubmitted ? (
             <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 p-6 rounded-xl inline-flex items-center gap-4">
               <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
               <span className="text-xl font-bold text-emerald-800 dark:text-emerald-300">Erfolgreich abgegeben!</span>
             </div>
          ) : (
             <button 
                onClick={uploadAndSubmit}
                disabled={isUploading}
                className="flex items-center justify-center gap-3 w-full sm:w-auto mx-auto px-10 py-6 rounded-2xl bg-emerald-600 text-white text-2xl font-bold shadow-xl hover:bg-emerald-500 hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
             >
                {isUploading ? <Loader2 className="animate-spin" size={32} /> : <UploadCloud size={32} />}
                Zur Korrektur einreichen
             </button>
          )}
        </div>
      )}
    </div>
  )
}
