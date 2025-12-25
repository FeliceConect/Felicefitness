/**
 * Funções de processamento de imagens
 */

// Criar imagem a partir de Blob
export function createImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(img.src)
      resolve(img)
    }
    img.onerror = reject
    img.src = URL.createObjectURL(blob)
  })
}

// Criar imagem a partir de File
export function createImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(img.src)
      resolve(img)
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

// Redimensionar imagem mantendo proporção
export async function resizeImage(
  file: File,
  maxWidth: number,
  maxHeight?: number
): Promise<Blob> {
  const img = await createImageFromFile(file)

  let width = img.width
  let height = img.height

  // Calcular novas dimensões mantendo proporção
  if (width > maxWidth) {
    height = (height * maxWidth) / width
    width = maxWidth
  }

  if (maxHeight && height > maxHeight) {
    width = (width * maxHeight) / height
    height = maxHeight
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Falha ao criar contexto canvas')

  ctx.drawImage(img, 0, 0, width, height)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Falha ao redimensionar'))),
      'image/jpeg',
      0.9
    )
  })
}

// Comprimir imagem
export async function compressImage(
  blob: Blob,
  quality: number = 0.85
): Promise<Blob> {
  const img = await createImageFromBlob(blob)

  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Falha ao criar contexto canvas')

  ctx.drawImage(img, 0, 0)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Falha ao comprimir'))),
      'image/jpeg',
      quality
    )
  })
}

// Gerar thumbnail
export async function generateThumbnail(
  file: File,
  size: number = 300
): Promise<Blob> {
  return resizeImage(file, size, size)
}

// Obter dimensões da imagem
export async function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  const img = await createImageFromFile(file)
  return {
    width: img.width,
    height: img.height
  }
}

// Converter File para base64
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Converter blob para File
export function blobToFile(blob: Blob, fileName: string): File {
  return new File([blob], fileName, { type: blob.type })
}

// Aplicar blur em região (para rosto)
export async function applyBlurRegion(
  file: File,
  region: { x: number; y: number; width: number; height: number },
  blurAmount: number = 20
): Promise<Blob> {
  const img = await createImageFromFile(file)

  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Falha ao criar contexto canvas')

  // Desenhar imagem original
  ctx.drawImage(img, 0, 0)

  // Aplicar blur na região
  ctx.filter = `blur(${blurAmount}px)`
  ctx.drawImage(
    img,
    region.x,
    region.y,
    region.width,
    region.height,
    region.x,
    region.y,
    region.width,
    region.height
  )
  ctx.filter = 'none'

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Falha ao aplicar blur'))),
      'image/jpeg',
      0.9
    )
  })
}

// Criar card de compartilhamento
export async function createShareCard(
  beforeFile: File,
  afterFile: File,
  options: {
    period: string
    weightChange?: number
    fatChange?: number
    muscleChange?: number
    showBranding?: boolean
  }
): Promise<Blob> {
  const [beforeImg, afterImg] = await Promise.all([
    createImageFromFile(beforeFile),
    createImageFromFile(afterFile)
  ])

  // Dimensões do card (proporção story 9:16)
  const cardWidth = 1080
  const cardHeight = 1920

  const canvas = document.createElement('canvas')
  canvas.width = cardWidth
  canvas.height = cardHeight

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Falha ao criar contexto canvas')

  // Background gradiente
  const gradient = ctx.createLinearGradient(0, 0, cardWidth, cardHeight)
  gradient.addColorStop(0, '#0A0A0F')
  gradient.addColorStop(1, '#14141F')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, cardWidth, cardHeight)

  // Fotos lado a lado
  const photoWidth = (cardWidth - 60) / 2
  const photoHeight = photoWidth * 1.5 // Proporção 2:3 para fotos de corpo

  const photoY = 200

  // Foto antes
  ctx.save()
  ctx.beginPath()
  ctx.roundRect(20, photoY, photoWidth, photoHeight, 16)
  ctx.clip()
  ctx.drawImage(beforeImg, 20, photoY, photoWidth, photoHeight)
  ctx.restore()

  // Foto depois
  ctx.save()
  ctx.beginPath()
  ctx.roundRect(cardWidth / 2 + 10, photoY, photoWidth, photoHeight, 16)
  ctx.clip()
  ctx.drawImage(afterImg, cardWidth / 2 + 10, photoY, photoWidth, photoHeight)
  ctx.restore()

  // Labels
  ctx.font = 'bold 32px system-ui'
  ctx.fillStyle = '#94A3B8'
  ctx.textAlign = 'center'
  ctx.fillText('ANTES', 20 + photoWidth / 2, photoY + photoHeight + 50)
  ctx.fillText('DEPOIS', cardWidth / 2 + 10 + photoWidth / 2, photoY + photoHeight + 50)

  // Período
  const statsY = photoY + photoHeight + 120
  ctx.font = 'bold 48px system-ui'
  ctx.fillStyle = '#FFFFFF'
  ctx.textAlign = 'center'
  ctx.fillText(options.period, cardWidth / 2, statsY)

  // Métricas
  let metricsY = statsY + 80
  ctx.font = '36px system-ui'

  if (options.weightChange !== undefined) {
    const sign = options.weightChange >= 0 ? '+' : ''
    ctx.fillStyle = options.weightChange >= 0 ? '#10B981' : '#EF4444'
    ctx.fillText(`${sign}${options.weightChange.toFixed(1)}kg peso`, cardWidth / 2, metricsY)
    metricsY += 60
  }

  if (options.fatChange !== undefined) {
    const sign = options.fatChange >= 0 ? '+' : ''
    ctx.fillStyle = options.fatChange <= 0 ? '#10B981' : '#EF4444'
    ctx.fillText(`${sign}${options.fatChange.toFixed(1)}% gordura`, cardWidth / 2, metricsY)
    metricsY += 60
  }

  if (options.muscleChange !== undefined) {
    const sign = options.muscleChange >= 0 ? '+' : ''
    ctx.fillStyle = options.muscleChange >= 0 ? '#10B981' : '#EF4444'
    ctx.fillText(`${sign}${options.muscleChange.toFixed(1)}kg músculo`, cardWidth / 2, metricsY)
  }

  // Branding
  if (options.showBranding) {
    ctx.font = 'bold 28px system-ui'
    ctx.fillStyle = '#8B5CF6'
    ctx.textAlign = 'center'
    ctx.fillText('FeliceFit', cardWidth / 2, cardHeight - 60)
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Falha ao criar card'))),
      'image/jpeg',
      0.9
    )
  })
}
