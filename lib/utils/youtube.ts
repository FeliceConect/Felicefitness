/**
 * Extract YouTube video ID from various URL formats
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

/**
 * Get YouTube thumbnail URL from video ID or URL
 */
export function getYouTubeThumbnail(urlOrId: string, quality: 'default' | 'hq' | 'maxres' = 'hq'): string | null {
  const videoId = extractYouTubeId(urlOrId) || urlOrId
  if (!videoId || videoId.length !== 11) return null
  const qualityMap = {
    default: 'default',
    hq: 'hqdefault',
    maxres: 'maxresdefault',
  }
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`
}
