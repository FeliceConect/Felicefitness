/**
 * Helpers de compressão de imagens com sharp.
 * Usado em rotas server-side que recebem uploads de usuários/pacientes.
 *
 * Padrão: resize para caber em 1080x1080 (preservando proporção, sem ampliar)
 * e converter para WebP quality 82.
 * Resultado: ~150-250 KB por foto (vs. 2-5 MB do iPhone cru).
 */
import sharp from 'sharp'

export interface CompressedImage {
  buffer: Buffer
  contentType: string
  extension: string
}

export interface CompressOptions {
  maxDimension?: number
  quality?: number
}

const DEFAULT_MAX_DIMENSION = 1080
const DEFAULT_QUALITY = 82

/**
 * Comprime uma imagem recebida como Buffer.
 * Retorna o buffer em WebP + metadados para upload.
 */
export async function compressImage(
  input: Buffer,
  options: CompressOptions = {}
): Promise<CompressedImage> {
  const maxDimension = options.maxDimension ?? DEFAULT_MAX_DIMENSION
  const quality = options.quality ?? DEFAULT_QUALITY

  const buffer = await sharp(input)
    .rotate() // respeita EXIF orientation
    .resize({
      width: maxDimension,
      height: maxDimension,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality })
    .toBuffer()

  return {
    buffer,
    contentType: 'image/webp',
    extension: 'webp',
  }
}

/**
 * Comprime uma imagem recebida como File (browser FormData / fetch).
 */
export async function compressImageFile(
  file: File,
  options: CompressOptions = {}
): Promise<CompressedImage> {
  const arrayBuffer = await file.arrayBuffer()
  return compressImage(Buffer.from(arrayBuffer), options)
}
