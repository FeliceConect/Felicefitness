import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Cliente admin com service role key para auto-confirmar usuários
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se service role key está configurada
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Configuração do servidor incompleta. Contate o administrador.' },
        { status: 500 }
      )
    }

    const supabaseAdmin = createAdminClient()

    // Criar usuário com auto-confirmação usando admin API
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirma o email
      user_metadata: {
        full_name: name
      }
    })

    if (error) {
      // Verificar se é erro de usuário já existente
      if (error.message.includes('already') || error.message.includes('exists')) {
        return NextResponse.json(
          { error: 'Este email já está cadastrado' },
          { status: 400 }
        )
      }

      console.error('Erro ao criar usuário:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Conta criada com sucesso!',
      user: {
        id: data.user.id,
        email: data.user.email
      }
    })

  } catch (error) {
    console.error('Erro no registro:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
