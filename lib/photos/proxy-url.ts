/**
 * URL de leitura de uma foto de evolução.
 *
 * As fotos ficam em bucket fechado e só são servidas pelo proxy autenticado —
 * nunca use `foto_url` direto em `<img src>`, ela não resolve. Centralizado
 * aqui porque três telas montam essa URL (grade, comparação e ficha do
 * paciente) e uma delas ficar para trás é uma imagem quebrada em produção.
 */
export function progressPhotoSrc(patientId: string, photoId: string): string {
  return `/api/admin/patients/${patientId}/progress-photos/image-proxy?photo_id=${encodeURIComponent(photoId)}`
}

/**
 * Mesma foto, vista pelo próprio paciente. A rota acima nega `client` de
 * propósito, então o titular tem um caminho separado.
 */
export function myProgressPhotoSrc(photoId: string): string {
  return `/api/me/progress-photos/${encodeURIComponent(photoId)}`
}
