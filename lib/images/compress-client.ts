/**
 * Compressão de imagens no client (browser) antes de upload.
 * Reduz tamanho e dimensões para evitar timeouts e erros 413.
 *
 * Padrão: redimensiona para caber em 1920x1920 (preservando proporção, sem ampliar)
 * e re-encode JPEG 0.85. Foto típica de iPhone cai de 3-5 MB para 300-600 KB.
 */

export interface CompressClientOptions {
  maxDimension?: number
  quality?: number
  mimeType?: string
}

const DEFAULT_MAX_DIMENSION = 1920
const DEFAULT_QUALITY = 0.85
const DEFAULT_MIME = 'image/jpeg'

export async function compressImageClient(
  file: File,
  options: CompressClientOptions = {}
): Promise<File> {
  const maxDimension = options.maxDimension ?? DEFAULT_MAX_DIMENSION
  const quality = options.quality ?? DEFAULT_QUALITY
  const mimeType = options.mimeType ?? DEFAULT_MIME

  if (!file.type.startsWith('image/') || file.type === 'image/gif') {
    return file
  }

  const bitmap = await createBitmap(file)
  const { width, height } = fitWithin(bitmap.width, bitmap.height, maxDimension)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    closeBitmap(bitmap)
    return file
  }

  ctx.drawImage(bitmap, 0, 0, width, height)
  closeBitmap(bitmap)

  const blob: Blob | null = await new Promise(resolve =>
    canvas.toBlob(resolve, mimeType, quality)
  )

  if (!blob || blob.size >= file.size) {
    return file
  }

  const extension = mimeType === 'image/webp' ? 'webp' : 'jpg'
  const baseName = file.name.replace(/\.[^.]+$/, '') || 'image'
  return new File([blob], `${baseName}.${extension}`, { type: mimeType })
}

async function createBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' })
    } catch {
      // fall through
    }
  }
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

function closeBitmap(bitmap: ImageBitmap | HTMLImageElement) {
  if ('close' in bitmap && typeof bitmap.close === 'function') {
    bitmap.close()
  }
}

function fitWithin(width: number, height: number, max: number) {
  if (width <= max && height <= max) return { width, height }
  const ratio = width > height ? max / width : max / height
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  }
}
