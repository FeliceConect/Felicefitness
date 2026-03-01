'use client'

import { useState } from 'react'
import { Play } from 'lucide-react'
import { extractYouTubeId, getYouTubeThumbnail } from '@/lib/utils/youtube'

interface YouTubeEmbedProps {
  url: string
  title?: string
  className?: string
}

export function YouTubeEmbed({ url, title, className = '' }: YouTubeEmbedProps) {
  const [playing, setPlaying] = useState(false)
  const videoId = extractYouTubeId(url)
  const thumbnail = videoId ? getYouTubeThumbnail(url, 'hq') : null

  if (!videoId) return null

  if (playing) {
    return (
      <div className={`relative w-full aspect-video rounded-xl overflow-hidden ${className}`}>
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
          title={title || 'Video'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    )
  }

  return (
    <button
      onClick={() => setPlaying(true)}
      className={`relative w-full aspect-video rounded-xl overflow-hidden group ${className}`}
    >
      {thumbnail && (
        <img
          src={thumbnail}
          alt={title || 'Video thumbnail'}
          className="w-full h-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
          <Play className="w-7 h-7 text-foreground ml-1" fill="currentColor" />
        </div>
      </div>
    </button>
  )
}
