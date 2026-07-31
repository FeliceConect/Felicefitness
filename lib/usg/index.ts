/**
 * Avaliação de composição corporal por ultrassom (modo B).
 *
 * A espessura em milímetros é a fonte de verdade; percentual de gordura e
 * massas são derivados versionados e recalculáveis. Ver lib/usg/conversion.ts
 * para a justificativa da tradução ultrassom → equação de dobra cutânea.
 */

export * from './types'
export * from './protocols'
export * from './equations'
export * from './conversion'
export * from './config'
export * from './engine'
export * from './references'
