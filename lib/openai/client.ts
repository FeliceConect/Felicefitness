import OpenAI from 'openai'

// Cliente OpenAI configurado para uso server-side
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Verificar se a API key está configurada
export function validateOpenAIConfig(): boolean {
  const key = process.env.OPENAI_API_KEY
  const isValid = !!key && key.length > 20 && key.startsWith('sk-')

  if (!isValid) {
    console.error('OpenAI Config Error:', {
      hasKey: !!key,
      keyLength: key?.length,
      startsWithSk: key?.startsWith('sk-')
    })
  }

  return isValid
}
