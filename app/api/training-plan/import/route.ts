import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { extractText } from 'unpdf'

// Extract text from PDF using unpdf
async function parsePDF(buffer: Buffer): Promise<string> {
  try {
    const uint8Array = new Uint8Array(buffer)
    const { text } = await extractText(uint8Array)
    return Array.isArray(text) ? text.join('\n') : text
  } catch (error) {
    console.error('PDF parsing error:', error)
    throw error
  }
}

// Tipos para o plano de treinos estruturado
interface Exercise {
  name: string
  sets: number
  reps: string // "15", "30s", "8 cada lado"
  rest_seconds?: number
  notes?: string
  is_warmup?: boolean
  muscle_group?: string
  weight_suggestion?: string
  alternatives?: string[]
}

interface TrainingDay {
  day_of_week: number // 0=Dom, 1=Seg, ..., 6=Sab
  day_name: string // "Segunda", "Terca", etc
  name: string // "Treino A - Pernas"
  muscle_groups: string[]
  estimated_duration: number // minutos
  exercises: Exercise[]
  warmup_notes?: string // "10 min bike/esteira"
  cooldown_notes?: string // "5 min alongamento"
}

interface TrainingWeek {
  week_number: number
  name: string
  focus?: string
  days: TrainingDay[]
}

interface ParsedTrainingPlan {
  name: string
  description?: string
  goal?: string // hypertrophy, strength, rehabilitation, endurance, weight_loss
  difficulty?: string // beginner, intermediate, advanced, light
  duration_weeks: number
  days_per_week: number
  session_duration: number // minutos
  equipment_needed: string[]
  special_rules: Array<{
    rule: string
  }>
  prohibited_exercises?: Array<{
    exercise: string
    reason: string
    substitute?: string
  }>
  weeks: TrainingWeek[]
}

const TRAINING_PLAN_PROMPT = `Voce e um personal trainer especialista. Analise este plano de treinos e extraia TODOS os dados de forma estruturada.

## INSTRUCOES:

1. Extraia informacoes gerais:
   - Nome do programa
   - Objetivo (hypertrophy, strength, rehabilitation, endurance, weight_loss, functional)
   - Dificuldade (beginner, intermediate, advanced, light)
   - Duracao em semanas
   - Dias por semana
   - Duracao de cada sessao

2. Para cada semana:
   - Numero da semana
   - Nome/fase
   - Foco (se houver)

3. Para cada dia de treino:
   - Dia da semana (0=Domingo, 1=Segunda, 2=Terca, 3=Quarta, 4=Quinta, 5=Sexta, 6=Sabado)
   - Nome do treino (ex: "Treino A - Pernas")
   - Grupos musculares trabalhados
   - Duracao estimada
   - Aquecimento (warmup_notes)
   - Alongamento (cooldown_notes)

4. Para cada exercicio:
   - Nome
   - Series (sets)
   - Repeticoes (reps) - pode ser numero, tempo ("30s") ou descricao ("8 cada lado")
   - Descanso em segundos
   - Observacoes
   - Se e aquecimento (is_warmup)
   - Grupo muscular

5. Identifique regras especiais e exercicios proibidos

## FORMATO DE RESPOSTA (JSON):
{
  "name": "Plano de Treinos - Janeiro 2026",
  "description": "Fase de reabilitacao pos lesao",
  "goal": "rehabilitation",
  "difficulty": "light",
  "duration_weeks": 4,
  "days_per_week": 5,
  "session_duration": 40,
  "equipment_needed": ["Maquinas", "Colchonete", "Bike ergometrica"],
  "special_rules": [
    { "rule": "Carga LEVE: Se conseguir fazer 20 reps, a carga esta certa" },
    { "rule": "Sem dor = correto: Qualquer dor no ombro ou lombar, PARA" }
  ],
  "prohibited_exercises": [
    { "exercise": "Afundo Bulgaro", "reason": "Risco lombar", "substitute": "Leg Press" },
    { "exercise": "Stiff", "reason": "Risco lombar", "substitute": "Cadeira Flexora" }
  ],
  "weeks": [
    {
      "week_number": 1,
      "name": "Semana 1 - Adaptacao",
      "focus": "Readaptacao muscular",
      "days": [
        {
          "day_of_week": 1,
          "day_name": "Segunda",
          "name": "Treino A - Pernas",
          "muscle_groups": ["Quadriceps", "Gluteos", "Panturrilha"],
          "estimated_duration": 35,
          "warmup_notes": "10 min bike ou esteira caminhando",
          "cooldown_notes": "5 min alongamento - quadriceps, posterior, panturrilha",
          "exercises": [
            {
              "name": "Leg Press",
              "sets": 3,
              "reps": "15",
              "rest_seconds": 45,
              "notes": "Pes largura dos ombros, carga leve",
              "is_warmup": false,
              "muscle_group": "Quadriceps"
            },
            {
              "name": "Cadeira Extensora",
              "sets": 3,
              "reps": "15",
              "rest_seconds": 45,
              "notes": "Carga leve, controle na descida",
              "muscle_group": "Quadriceps"
            }
          ]
        }
      ]
    }
  ]
}

IMPORTANTE:
- EXTRAIA ABSOLUTAMENTE TODOS OS EXERCICIOS E DETALHES. Nao resuma nem omita nada.
- Se o plano usa a mesma estrutura para todas as semanas, replique para cada semana.
- Identifique corretamente os dias da semana baseado no contexto.
- RESPONDA APENAS COM O JSON, sem markdown ou explicacoes.`

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    // Check if user is superadmin or trainer
    const { data: profile } = await supabase
      .from('fitness_profiles')
      .select('role, email')
      .eq('id', user.id)
      .single()

    const profileData = profile as unknown as { role?: string; email?: string } | null
    const isSuperAdmin = profileData?.email === 'felicemed@gmail.com' || profileData?.role === 'super_admin'

    // Check if user is a trainer
    const { data: professional } = await supabase
      .from('fitness_professionals')
      .select('id, type')
      .eq('user_id', user.id)
      .single()

    const professionalData = professional as unknown as { id?: string; type?: string } | null
    const isTrainer = professionalData?.type === 'trainer'

    if (!isSuperAdmin && !isTrainer) {
      return NextResponse.json(
        { error: 'Acesso restrito a superadmins e personal trainers' },
        { status: 403 }
      )
    }

    // Get content from request
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const textContent = formData.get('text') as string | null
    const clientId = formData.get('clientId') as string | null

    if (!file && !textContent) {
      return NextResponse.json(
        { error: 'Forneca um arquivo ou texto do plano de treinos' },
        { status: 400 }
      )
    }

    let contentToAnalyze: string | { type: 'image'; data: string; mimeType: string }

    if (file) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Check file type
      if (file.type === 'application/pdf') {
        try {
          const pdfText = await parsePDF(buffer)
          contentToAnalyze = pdfText

          if (!contentToAnalyze || contentToAnalyze.trim().length < 50) {
            return NextResponse.json({
              error: 'PDF parece ser baseado em imagem. Por favor, envie como foto/screenshot.',
              hint: 'Tente tirar uma foto do plano ou copiar o texto'
            }, { status: 400 })
          }
        } catch (pdfError) {
          console.error('PDF parse error:', pdfError)
          return NextResponse.json({
            error: 'Erro ao processar PDF. Tente enviar como imagem.',
            details: pdfError instanceof Error ? pdfError.message : 'Unknown error'
          }, { status: 400 })
        }
      } else if (file.type.startsWith('image/')) {
        const base64 = buffer.toString('base64')
        contentToAnalyze = {
          type: 'image',
          data: base64,
          mimeType: file.type
        }
      } else if (
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.type === 'application/msword'
      ) {
        // For DOCX/DOC files, try to extract text
        // Since we can't easily parse DOCX on server, treat as text if possible
        const textDecoded = buffer.toString('utf-8')
        // Check if it looks like extracted text (not binary)
        if (textDecoded.includes('PLANO') || textDecoded.includes('TREINO')) {
          contentToAnalyze = textDecoded
        } else {
          return NextResponse.json({
            error: 'Arquivo DOCX detectado. Por favor, copie o texto e cole, ou exporte como PDF.',
            hint: 'Abra o documento, selecione todo o texto (Ctrl+A) e cole aqui'
          }, { status: 400 })
        }
      } else {
        // Try to read as text
        contentToAnalyze = buffer.toString('utf-8')
      }
    } else {
      contentToAnalyze = textContent!
    }

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // Call GPT-4 Vision
    let response
    if (typeof contentToAnalyze === 'object' && contentToAnalyze.type === 'image') {
      response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: TRAINING_PLAN_PROMPT },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${contentToAnalyze.mimeType};base64,${contentToAnalyze.data}`,
                  detail: 'high',
                },
              },
            ],
          },
        ],
        max_tokens: 16000,
        temperature: 0.1,
      })
    } else {
      response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: `${TRAINING_PLAN_PROMPT}\n\n--- PLANO DE TREINOS ---\n${contentToAnalyze}`,
          },
        ],
        max_tokens: 16000,
        temperature: 0.1,
      })
    }

    const content = response.choices[0]?.message?.content

    if (!content) {
      return NextResponse.json(
        { error: 'Nao foi possivel analisar o plano de treinos' },
        { status: 500 }
      )
    }

    // Parse JSON response
    let parsedPlan: ParsedTrainingPlan
    try {
      let cleanContent = content.trim()
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.slice(7)
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.slice(3)
      }
      if (cleanContent.endsWith('```')) {
        cleanContent = cleanContent.slice(0, -3)
      }
      cleanContent = cleanContent.trim()

      parsedPlan = JSON.parse(cleanContent)
    } catch (parseError) {
      console.error('Error parsing training plan:', parseError, content)
      return NextResponse.json({
        error: 'Erro ao processar dados do plano',
        raw_response: content
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: parsedPlan,
      professional_id: professionalData?.id || null,
      client_id: clientId
    })

  } catch (error) {
    console.error('Training plan import error:', error)

    let errorMessage = 'Erro interno ao importar plano de treinos'
    const errorDetails = error instanceof Error ? error.message : 'Unknown error'

    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        errorMessage = 'Erro de configuracao: chave da API nao configurada'
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'Limite de requisicoes atingido. Aguarde alguns minutos.'
      } else if (error.message.includes('model')) {
        errorMessage = 'Erro ao acessar modelo de IA'
      }
    }

    return NextResponse.json({
      error: errorMessage,
      details: errorDetails
    }, { status: 500 })
  }
}
