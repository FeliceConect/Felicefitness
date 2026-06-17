// Formatação amigável do campo `fitness_profiles.objetivo`.
//
// O objetivo pode estar gravado em três formatos históricos:
//  - id único do onboarding: "perder_peso"
//  - lista separada por vírgula (onboarding multi-seleção): "perder_peso,ganhar_massa,flexibilidade"
//  - formato do perfil com título e data: "id|titulo|data" (ex: "saude|Saúde e Bem-estar|2026-03-12")
//
// Esta função normaliza qualquer um desses formatos em um texto legível
// para exibição nos portais profissionais.

const OBJETIVO_LABELS: Record<string, string> = {
  // Onboarding (multi-seleção)
  perder_peso: 'Perder peso',
  ganhar_massa: 'Ganhar massa muscular',
  saude: 'Saúde e bem-estar',
  forca: 'Aumentar força',
  resistencia: 'Melhorar resistência',
  flexibilidade: 'Aumentar flexibilidade',
  // Perfil (marcos / objetivos predefinidos)
  ski_suica: 'Preparação para Esqui',
  maratona: 'Maratona',
  hipertrofia: 'Ganho de massa',
  emagrecimento: 'Emagrecimento',
  competicao: 'Competição',
  viagem: 'Viagem/Evento',
  outro: 'Outro',
  // Legado / cálculo de macros
  definicao: 'Definição muscular',
  manter: 'Manutenção',
  manutencao: 'Manutenção',
  perda_peso: 'Perder peso',
  ganho_massa: 'Ganhar massa muscular',
  massa: 'Ganhar massa muscular',
}

function labelForToken(token: string): string {
  const t = token.trim()
  if (!t) return ''
  const key = t.toLowerCase()
  if (OBJETIVO_LABELS[key]) return OBJETIVO_LABELS[key]
  // Fallback: snake_case -> "Snake Case"
  return t
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Converte o valor cru de `objetivo` num texto legível para exibição. */
export function formatObjetivo(raw?: string | null): string {
  if (!raw) return ''
  const value = raw.trim()
  if (!value) return ''

  // Formato do perfil: "id|titulo|data" — preferir o título humanizado.
  if (value.includes('|')) {
    const [id, titulo] = value.split('|')
    if (titulo && titulo.trim()) return titulo.trim()
    return labelForToken(id)
  }

  // Lista separada por vírgula (onboarding multi-seleção).
  if (value.includes(',')) {
    const parts = value
      .split(',')
      .map(labelForToken)
      .filter(Boolean)
    // Remover duplicatas mantendo a ordem.
    return Array.from(new Set(parts)).join(', ')
  }

  return labelForToken(value)
}
