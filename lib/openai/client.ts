import OpenAI from 'openai'

// Cliente OpenAI configurado para uso server-side
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Verificar se a API key está configurada
export function validateOpenAIConfig(): boolean {
  return !!process.env.OPENAI_API_KEY
}
