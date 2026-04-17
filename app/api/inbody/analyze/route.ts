import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { compressImage } from '@/lib/images/compress'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

const MAX_FILE_SIZE = 15 * 1024 * 1024 // 15MB bruto
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
const ALLOWED_PDF_TYPES = ['application/pdf']
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_PDF_TYPES]

// POST - Analisa foto do relatório InBody com GPT-4o Vision
// Retorna os campos estruturados + faz upload da foto comprimida.
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabaseAdmin: any = getAdminClient()

    // Só profissionais/admin podem chamar o OCR
    const { data: profile } = await supabaseAdmin
      .from('fitness_profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (!profile || !['super_admin', 'admin', 'nutritionist', 'trainer', 'coach', 'physiotherapist', 'medico_integrativo'].includes(profile.role)) {
      return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 })
    }

    // Rate limit: 30 análises OCR/mês por avaliador. Super_admin não tem limite.
    // Medido pela quantidade de bioimpedâncias com fonte='inbody_ia' criadas pelo avaliador nos últimos 30 dias.
    // (best-effort: se o profissional chamar o OCR e não salvar, a chamada não é contabilizada,
    //  mas isso é aceitável pois sempre há a intenção de salvar após a revisão.)
    const MONTHLY_LIMIT = 30
    let used = 0
    if (profile.role !== 'super_admin') {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

      const { count: analysisCount } = await supabaseAdmin
        .from('fitness_body_compositions')
        .select('id', { count: 'exact', head: true })
        .eq('avaliador_id', user.id)
        .eq('fonte', 'inbody_ia')
        .gte('created_at', startOfMonth)

      used = analysisCount || 0
      if (used >= MONTHLY_LIMIT) {
        return NextResponse.json({
          success: false,
          error: `Limite de análises IA atingido este mês (${used}/${MONTHLY_LIMIT})`,
          limit_reached: true,
          used,
          limit: MONTHLY_LIMIT,
        }, { status: 429 })
      }
    }

    const formData = await request.formData()
    const file = formData.get('image') as File | null

    if (!file) {
      return NextResponse.json({ success: false, error: 'Arquivo obrigatório' }, { status: 400 })
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ success: false, error: 'Tipo de arquivo não permitido (envie imagem ou PDF do InBody)' }, { status: 400 })
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: 'Arquivo muito grande (máx. 15MB)' }, { status: 400 })
    }

    const isPdf = ALLOWED_PDF_TYPES.includes(file.type)
    const arrayBuffer = await file.arrayBuffer()
    const rawBuffer = Buffer.from(arrayBuffer)

    let imageUrl: string | null = null
    let pdfText: string | null = null
    let base64: string | null = null

    if (isPdf) {
      // Extrai texto do PDF (InBody PDFs são text-based — não precisa OCR de imagem)
      const { extractText } = await import('unpdf')
      try {
        const { text } = await extractText(new Uint8Array(arrayBuffer), { mergePages: true })
        pdfText = (text || '').trim()
      } catch (err) {
        console.error('Erro extrair texto PDF:', err)
        return NextResponse.json({
          success: false,
          error: 'Não foi possível ler o PDF. Verifique se o arquivo não está corrompido.',
        }, { status: 422 })
      }

      if (!pdfText) {
        return NextResponse.json({
          success: false,
          error: 'PDF não contém texto extraível. Tente exportar como imagem ou enviar foto.',
        }, { status: 422 })
      }

      // Upload do PDF original para referência
      const fileName = `${user.id}/inbody_${Date.now()}.pdf`
      const { error: uploadError } = await supabaseAdmin.storage
        .from('progress-photos')
        .upload(fileName, rawBuffer, {
          contentType: 'application/pdf',
          upsert: false,
        })
      if (!uploadError) {
        const { data: { publicUrl } } = supabaseAdmin.storage
          .from('progress-photos')
          .getPublicUrl(fileName)
        imageUrl = publicUrl
      }
    } else {
      // Fluxo de imagem original
      const storageCompressed = await compressImage(rawBuffer)
      const ocrCompressed = await compressImage(rawBuffer, { maxDimension: 1600, quality: 90 })
      base64 = ocrCompressed.buffer.toString('base64')

      const fileName = `${user.id}/inbody_${Date.now()}.${storageCompressed.extension}`
      const { error: uploadError } = await supabaseAdmin.storage
        .from('progress-photos')
        .upload(fileName, storageCompressed.buffer, {
          contentType: storageCompressed.contentType,
          upsert: false,
        })
      if (!uploadError) {
        const { data: { publicUrl } } = supabaseAdmin.storage
          .from('progress-photos')
          .getPublicUrl(fileName)
        imageUrl = publicUrl
      }
    }

    // Análise com GPT-4o (Vision para imagem, texto puro para PDF)
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1500,
      messages: [
        {
          role: 'system',
          content: `Você é um especialista em leitura de relatórios de bioimpedância InBody.
Ao receber ${isPdf ? 'o texto extraído de um PDF' : 'a foto'} de um resultado InBody, extraia TODOS os valores numéricos ${isPdf ? 'presentes' : 'visíveis'}.

Responda EXCLUSIVAMENTE em JSON válido, sem markdown, sem backticks, sem texto extra.
Use null quando o campo não estiver visível ou não for possível extrair com certeza.

Formato:
{
  "peso": 72.5,
  "altura_cm": 175,
  "idade": 35,
  "agua_corporal_l": 42.5,
  "proteina_kg": 11.8,
  "minerais_kg": 4.1,
  "massa_gordura_kg": 14.2,
  "massa_muscular_esqueletica_kg": 32.5,
  "massa_livre_gordura_kg": 58.3,
  "imc": 23.7,
  "percentual_gordura": 19.6,
  "taxa_metabolica_basal": 1635,
  "gordura_visceral": 7,
  "pontuacao_inbody": 82,
  "relacao_cintura_quadril": 0.88,
  "peso_ideal": 70.0,
  "controle_peso": -2.5,
  "controle_gordura": -4.0,
  "controle_muscular": 1.5,
  "grau_obesidade": 116,
  "massa_magra_braco_direito": 3.1,
  "massa_magra_braco_direito_percent": 115.8,
  "massa_magra_braco_esquerdo": 3.0,
  "massa_magra_braco_esquerdo_percent": 110.4,
  "massa_magra_tronco": 26.5,
  "massa_magra_tronco_percent": 103.6,
  "massa_magra_perna_direita": 9.2,
  "massa_magra_perna_direita_percent": 103.7,
  "massa_magra_perna_esquerda": 9.1,
  "massa_magra_perna_esquerda_percent": 101.1,
  "gordura_braco_direito": 0.6,
  "gordura_braco_direito_percent": 121.9,
  "gordura_braco_esquerdo": 0.6,
  "gordura_braco_esquerdo_percent": 134.9,
  "gordura_tronco": 7.8,
  "gordura_tronco_percent": 192.1,
  "gordura_perna_direita": 2.3,
  "gordura_perna_direita_percent": 127.3,
  "gordura_perna_esquerda": 2.3,
  "gordura_perna_esquerda_percent": 124.8,
  "confidence": 0.92
}

Regras:
- Use valores numéricos (sem unidades)
- Use ponto decimal (ex: 72.5, não 72,5)
- Os campos "_percent" representam a porcentagem do valor ideal mostrada abaixo de cada segmento (ex: "110,4%")
- "grau_obesidade" é o valor em % mostrado em "Grau de Obesidade" (ex: "116%")
- DIREITA vs ESQUERDA: SEMPRE use o RÓTULO escrito no relatório ("Direita"/"D" ou "Esquerda"/"E"), NUNCA infira pela posição na coluna. ATENÇÃO: no InBody, "Direito" geralmente aparece à ESQUERDA da página e "Esquerdo" à DIREITA da página (perspectiva espelhada do paciente). Procure as letras "D" e "E" ou as palavras completas em cada barra/segmento antes de classificar. Se não houver rótulo claro, retorne null e NÃO chute.
- "confidence" é sua confiança na leitura geral (0.0 a 1.0)
- Se o conteúdo não for um relatório InBody, retorne: {"error": "não é um relatório InBody"}
- Nunca invente valores — se não ${isPdf ? 'encontrar' : 'ver'}, null.`
        },
        {
          role: 'user',
          content: isPdf
            ? `Extraia todos os dados deste relatório InBody (texto extraído do PDF):\n\n${pdfText}`
            : [
                { type: 'text', text: 'Extraia todos os dados deste relatório InBody:' },
                { type: 'image_url', image_url: { url: `data:image/webp;base64,${base64}`, detail: 'high' } },
              ],
        },
      ],
    })

    const rawContent = response.choices[0]?.message?.content || ''
    let parsed: Record<string, unknown>
    try {
      const cleaned = rawContent.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
      parsed = JSON.parse(cleaned)
    } catch {
      console.error('Erro parse InBody OCR:', rawContent)
      return NextResponse.json({
        success: false,
        error: 'A IA não retornou uma análise válida. Tente uma foto com melhor iluminação e enquadramento.',
      }, { status: 422 })
    }

    if (parsed.error) {
      return NextResponse.json({
        success: false,
        error: String(parsed.error),
      }, { status: 422 })
    }

    return NextResponse.json({
      success: true,
      data: parsed,
      image_url: imageUrl,
      tokens_used: response.usage?.total_tokens || 0,
      usage: { used: used + 1, limit: MONTHLY_LIMIT },
    })
  } catch (error) {
    console.error('Erro na análise InBody:', error)
    const message = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
