import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'

// Type for InBody analysis result
interface InBodyAnalysisResult {
  // Basic data
  peso: number | null
  altura_cm: number | null
  idade: number | null

  // Body composition
  agua_corporal_l: number | null
  proteina_kg: number | null
  minerais_kg: number | null
  massa_gordura_kg: number | null
  massa_muscular_esqueletica_kg: number | null
  massa_livre_gordura_kg: number | null

  // Percentages and indices
  imc: number | null
  percentual_gordura: number | null
  taxa_metabolica_basal: number | null
  gordura_visceral: number | null
  pontuacao_inbody: number | null

  // Segmental analysis - lean mass (kg)
  massa_magra_braco_direito: number | null
  massa_magra_braco_esquerdo: number | null
  massa_magra_tronco: number | null
  massa_magra_perna_direita: number | null
  massa_magra_perna_esquerda: number | null

  // Segmental analysis - lean mass (%)
  massa_magra_braco_direito_percent: number | null
  massa_magra_braco_esquerdo_percent: number | null
  massa_magra_tronco_percent: number | null
  massa_magra_perna_direita_percent: number | null
  massa_magra_perna_esquerda_percent: number | null

  // Segmental analysis - fat mass (kg)
  gordura_braco_direito: number | null
  gordura_braco_esquerdo: number | null
  gordura_tronco: number | null
  gordura_perna_direita: number | null
  gordura_perna_esquerda: number | null

  // Segmental analysis - fat (%)
  gordura_braco_direito_percent: number | null
  gordura_braco_esquerdo_percent: number | null
  gordura_tronco_percent: number | null
  gordura_perna_direita_percent: number | null
  gordura_perna_esquerda_percent: number | null

  // Control recommendations
  controle_peso: number | null
  controle_gordura: number | null
  controle_muscular: number | null
  peso_ideal: number | null

  // Reference ranges
  massa_muscular_esqueletica_ref_min: number | null
  massa_muscular_esqueletica_ref_max: number | null

  // Additional
  relacao_cintura_quadril: number | null
  grau_obesidade: number | null

  // Confidence and raw text
  confidence: number
  raw_text?: string
}

const INBODY_ANALYSIS_PROMPT = `Você é um especialista em análise de resultados de bioimpedância InBody.

Analise esta imagem de um resultado InBody e extraia TODOS os dados numéricos que conseguir identificar.

## LAYOUT TÍPICO DO INBODY (onde encontrar cada dado):

### CABEÇALHO (topo):
- ID, Altura (cm), Idade, Sexo, Data/Hora
- **Pontuação InBody**: geralmente no canto superior direito, mostra "XX/100 Pontos"

### SEÇÃO "Análise da Composição Corporal" (esquerda superior):
- **Água Corporal Total**: linha "Quantidade total de água no corpo" - valor em L (ex: 50.1 L)
- **Proteína**: linha "Para a construção de músculos" - valor em kg (ex: 13.5 kg)
- **Minerais**: linha "Para fortalecer os ossos" - valor em kg (ex: 4.70 kg)
- **Massa de Gordura**: linha "Para armazenar energia extra" - valor em kg (ex: 13.5 kg)
- **Peso**: linha "A soma acima" - valor em kg

### SEÇÃO "Análise Músculo-Gordura" (centro):
- Gráfico de barras horizontal com 3 linhas:
  1. **Peso**: valor à direita (ex: 81.8 kg)
  2. **Massa Muscular Esquelética**: valor à direita (ex: 38.8 kg) - use este valor para massa_muscular_esqueletica_kg
  3. **Massa de Gordura**: valor à direita (ex: 13.5 kg) - use este valor para massa_gordura_kg
- IMPORTANTE: A Massa de Gordura aqui é o mesmo valor que "Para armazenar energia extra" na Composição Corporal

### SEÇÃO "Análise de Obesidade":
- **IMC**: valor numérico (ex: 25.0)
- **PGC (Percentual de Gordura Corporal)**: valor em % (ex: 16.5%)

### SEÇÃO "Controle de Peso" (direita):
- **Peso Ideal**: valor em kg (ex: 80.4 kg)
- **Controle de Peso**: valor com sinal +/- em kg (ex: -1.4 kg)
- **Controle de Gordura**: valor com sinal +/- em kg (ex: -1.4 kg)
- **Controle Muscular**: valor com sinal +/- em kg (ex: 0.0 kg)

### SEÇÃO "Dados Adicionais" (direita):
- **Massa Muscular Esquelética**: valor em kg com faixa de referência
- **Massa Livre de Gordura**: valor em kg (DIFERENTE de Massa Muscular!)
- **Taxa Metabólica Basal**: valor em kcal (ex: 1845 kcal)
- **Relação Cintura-Quadril**: valor decimal (ex: 0.88)
- **Nível de Gordura Visceral**: NÚMERO INTEIRO de 1 a 20 (ex: 5) - ATENÇÃO: fica na seção "Dados Adicionais", NÃO confundir com outros números!
- **Grau de Obesidade**: valor em % (ex: 113%)

### SEÇÃO "Análise da Massa Magra Segmentar" (centro inferior):
- 5 valores em kg para: Braço Direito, Braço Esquerdo, Tronco, Perna Direita, Perna Esquerda
- Cada um tem valor absoluto (kg) e percentual (%)

### SEÇÃO "Análise da Gordura Segmentar" (centro inferior direita):
- 5 valores em kg para: Braço Direito, Braço Esquerdo, Tronco, Perna Direita, Perna Esquerda

## REGRAS CRÍTICAS:
1. **Gordura Visceral**: É um número INTEIRO entre 1-20, geralmente aparece como "Nível de Gordura Visceral: X" onde X é um número pequeno (1-20). NÃO confunda com percentuais!
2. **Massa Livre de Gordura** ≠ **Massa Muscular Esquelética**: São valores DIFERENTES!
3. Extraia os valores EXATAMENTE como aparecem
4. Use null para campos que não conseguir identificar com certeza
5. Os valores devem ser numéricos (sem unidades)
6. Para porcentagens, use o valor sem o símbolo %

Retorne um JSON com a seguinte estrutura:
{
  "peso": number | null,
  "altura_cm": number | null,
  "idade": number | null,
  "agua_corporal_l": number | null,
  "proteina_kg": number | null,
  "minerais_kg": number | null,
  "massa_gordura_kg": number | null,
  "massa_muscular_esqueletica_kg": number | null,
  "massa_livre_gordura_kg": number | null,
  "imc": number | null,
  "percentual_gordura": number | null,
  "taxa_metabolica_basal": number | null,
  "gordura_visceral": number | null,
  "pontuacao_inbody": number | null,
  "massa_magra_braco_direito": number | null,
  "massa_magra_braco_esquerdo": number | null,
  "massa_magra_tronco": number | null,
  "massa_magra_perna_direita": number | null,
  "massa_magra_perna_esquerda": number | null,
  "massa_magra_braco_direito_percent": number | null,
  "massa_magra_braco_esquerdo_percent": number | null,
  "massa_magra_tronco_percent": number | null,
  "massa_magra_perna_direita_percent": number | null,
  "massa_magra_perna_esquerda_percent": number | null,
  "gordura_braco_direito": number | null,
  "gordura_braco_esquerdo": number | null,
  "gordura_tronco": number | null,
  "gordura_perna_direita": number | null,
  "gordura_perna_esquerda": number | null,
  "gordura_braco_direito_percent": number | null,
  "gordura_braco_esquerdo_percent": number | null,
  "gordura_tronco_percent": number | null,
  "gordura_perna_direita_percent": number | null,
  "gordura_perna_esquerda_percent": number | null,
  "controle_peso": number | null,
  "controle_gordura": number | null,
  "controle_muscular": number | null,
  "peso_ideal": number | null,
  "massa_muscular_esqueletica_ref_min": number | null,
  "massa_muscular_esqueletica_ref_max": number | null,
  "relacao_cintura_quadril": number | null,
  "grau_obesidade": number | null,
  "confidence": number (0-100, sua confiança na extração),
  "raw_text": string (texto extraído bruto, opcional)
}

RESPONDA APENAS COM O JSON, sem markdown ou explicações.`

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Get image from request
    const formData = await request.formData()
    const imageFile = formData.get('image') as File | null

    if (!imageFile) {
      return NextResponse.json({ error: 'Imagem não fornecida' }, { status: 400 })
    }

    // Convert to base64
    const bytes = await imageFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Image = buffer.toString('base64')
    const mimeType = imageFile.type || 'image/jpeg'

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // Call GPT-4 Vision
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: INBODY_ANALYSIS_PROMPT,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
                detail: 'high',
              },
            },
          ],
        },
      ],
      max_tokens: 2000,
      temperature: 0.1,
    })

    const content = response.choices[0]?.message?.content

    if (!content) {
      return NextResponse.json({ error: 'Não foi possível analisar a imagem' }, { status: 500 })
    }

    // Parse JSON response
    let analysisResult: InBodyAnalysisResult
    try {
      // Clean the response - remove markdown code blocks if present
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

      analysisResult = JSON.parse(cleanContent)
    } catch (parseError) {
      console.error('Error parsing InBody analysis:', parseError, content)
      return NextResponse.json({
        error: 'Erro ao processar dados do InBody',
        raw_response: content
      }, { status: 500 })
    }

    // Upload original image to storage for reference
    let imageUrl: string | null = null
    try {
      const fileName = `${user.id}/inbody/${Date.now()}.${mimeType.split('/')[1] || 'jpg'}`
      const { error: uploadError } = await supabase.storage
        .from('body-compositions')
        .upload(fileName, buffer, {
          contentType: mimeType,
          upsert: false
        })

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('body-compositions')
          .getPublicUrl(fileName)
        imageUrl = urlData.publicUrl
      }
    } catch (uploadError) {
      console.error('Error uploading InBody image:', uploadError)
      // Continue without image - not critical
    }

    return NextResponse.json({
      success: true,
      data: analysisResult,
      image_url: imageUrl
    })

  } catch (error) {
    console.error('InBody analysis error:', error)
    return NextResponse.json({
      error: 'Erro interno ao analisar InBody',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
