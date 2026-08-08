'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Play, Pause, Rewind, FastForward, Settings } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'

export default function VideoPlayerPage() {
  const params = useParams()
  const router = useRouter()
  const lang = params.lang as string
  const videoId = params.id as string
  
  const [video, setVideo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Player state
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1.0)
  
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    async function loadVideo() {
      const supabase = createClient()
      const { data } = await supabase
        .from('videos')
        .select('*')
        .eq('id', videoId)
        .single()
      
      if (data) {
        if (data.is_external) {
           // Redirect externals just in case they navigated here directly
           window.location.href = data.external_url
           return
        }
        setVideo(data)
      }
      setLoading(false)
    }
    loadVideo()
  }, [videoId])

  if (loading) {
    return <div className="p-12 text-center text-xl text-gray-500 animate-pulse">Lade Video...</div>
  }

  if (!video) {
    return (
      <div className="p-12 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Video nicht gefunden</h1>
        <Link href={`/${lang}/dashboard/videos`} className="text-blue-600 text-lg hover:underline">
          Zurück zur Übersicht
        </Link>
      </div>
    )
  }

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause()
      else videoRef.current.play()
      setIsPlaying(!isPlaying)
    }
  }

  const toggleSpeed = () => {
    if (videoRef.current) {
      const newRate = playbackRate === 1.0 ? 0.8 : 1.0
      videoRef.current.playbackRate = newRate
      setPlaybackRate(newRate)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Link 
        href={`/${lang}/dashboard/videos`}
        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mb-6 text-lg transition-colors"
      >
        <ArrowLeft size={24} /> Zurück zur Lektionsübersicht
      </Link>

      <div className="bg-white rounded-3xl shadow-xl overflow-hidden ring-1 ring-gray-900/5">
        {/* Video Area */}
        <div className="aspect-video bg-black relative flex items-center justify-center">
          {video.video_url ? (
            <video 
              ref={videoRef}
              src={video.video_url} 
              className="w-full h-full"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
          ) : (
            <div className="text-center p-8">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-yellow-500/20 mb-6">
                <Play className="h-12 w-12 text-yellow-500" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">In Vorbereitung</h2>
              <p className="text-xl text-gray-400">
                Dieses Video wird bald veröffentlicht.
              </p>
            </div>
          )}
        </div>

        {/* Custom Controls (Barrierefrei) */}
        {video.video_url && (
          <div className="bg-gray-900 p-6 flex items-center justify-center gap-8">
            <button 
              onClick={() => { if(videoRef.current) videoRef.current.currentTime -= 10 }}
              className="p-4 rounded-full bg-gray-800 text-white hover:bg-gray-700 transition-colors"
              aria-label="10 Sekunden zurück"
            >
              <Rewind size={32} />
            </button>
            
            <button 
              onClick={togglePlay}
              className="p-6 rounded-full bg-blue-600 text-white hover:bg-blue-500 transition-colors shadow-lg"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause size={40} /> : <Play size={40} className="ml-2" />}
            </button>
            
            <button 
              onClick={() => { if(videoRef.current) videoRef.current.currentTime += 10 }}
              className="p-4 rounded-full bg-gray-800 text-white hover:bg-gray-700 transition-colors"
              aria-label="10 Sekunden vor"
            >
              <FastForward size={32} />
            </button>
            
            <button 
              onClick={toggleSpeed}
              className={`ml-8 flex items-center gap-2 px-6 py-4 rounded-xl font-bold text-lg transition-colors ${
                playbackRate === 0.8 ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
              title="Langsamer abspielen"
            >
              <Settings size={24} />
              {playbackRate}x
            </button>
          </div>
        )}

        {/* Video Info */}
        <div className="p-10">
          <div className="text-blue-600 font-bold text-lg mb-2">Lektion {video.lesson}</div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">{video.title}</h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            {video.description}
          </p>
        </div>
      </div>
    </div>
  )
}
