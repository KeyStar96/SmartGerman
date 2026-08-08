'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { submitAudioUrl } from '@/app/actions/feedback'
import { Mic, Square, Play, UploadCloud, Loader2, CheckCircle2 } from 'lucide-react'

export default function AudioRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [isUploading, setIsUploading] = useState(false)
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
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' })
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
    if (!audioBlob) return
    setIsUploading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')

      const fileName = `${user.id}-${Date.now()}.webm`
      
      const { data, error } = await supabase.storage
        .from('audio_submissions')
        .upload(fileName, audioBlob, { contentType: 'audio/webm' })

      if (error) throw error

      const { data: publicUrlData } = supabase.storage
        .from('audio_submissions')
        .getPublicUrl(fileName)

      const result = await submitAudioUrl(publicUrlData.publicUrl)
      if (result.success) {
        setIsSubmitted(true)
      } else {
         throw new Error(result.error)
      }
    } catch (err) {
      console.error('Upload error:', err)
      alert('Es gab einen Fehler beim Hochladen. Bitte versuche es erneut.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="bg-white rounded-3xl p-8 shadow-md ring-1 ring-gray-900/5 text-center">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Deine Aussprache üben</h2>
      <p className="text-lg text-gray-600 mb-8">
        Nimm dich selbst auf, höre es dir an und reiche es zur Korrektur ein.
      </p>

      {/* Recording Indicator */}
      {isRecording && (
        <div className="flex items-center justify-center gap-3 mb-8">
          <span className="relative flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500"></span>
          </span>
          <span className="text-xl font-bold text-red-600">Aufnahme läuft...</span>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-8">
        {!isRecording ? (
          <button 
            onClick={startRecording}
            className="flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-5 rounded-2xl bg-red-600 text-white text-xl font-bold shadow-lg hover:bg-red-500 transition-all"
          >
            <Mic size={28} /> {audioUrl ? 'Neu aufnehmen' : 'Aufnahme starten'}
          </button>
        ) : (
          <button 
            onClick={stopRecording}
            className="flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-5 rounded-2xl bg-gray-900 text-white text-xl font-bold shadow-lg hover:bg-gray-800 transition-all"
          >
            <Square size={28} /> Stoppen
          </button>
        )}

        {audioUrl && !isRecording && (
          <button 
            onClick={playAudio}
            className="flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-5 rounded-2xl bg-blue-100 text-blue-700 text-xl font-bold hover:bg-blue-200 transition-all"
          >
            <Play size={28} /> Anhören
          </button>
        )}
      </div>

      {/* Submit */}
      {audioUrl && !isRecording && (
        <div className="border-t pt-8 mt-4">
          {isSubmitted ? (
             <div className="bg-green-50 border border-green-200 p-6 rounded-xl inline-flex items-center gap-4">
               <CheckCircle2 className="w-8 h-8 text-green-600" />
               <span className="text-xl font-bold text-green-800">Erfolgreich abgegeben!</span>
             </div>
          ) : (
             <button 
                onClick={uploadAndSubmit}
                disabled={isUploading}
                className="flex items-center justify-center gap-3 w-full sm:w-auto mx-auto px-10 py-6 rounded-2xl bg-green-600 text-white text-2xl font-bold shadow-xl hover:bg-green-500 hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
