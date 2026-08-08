import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

/**
 * Pedido de exclusão de conta do próprio paciente.
 *
 * Não é apagamento imediato, e isso é deliberado. A política publicada em
 * /privacidade promete remoção "em até 30 dias, exceto quando a retenção for
 * exigida por lei" — e boa parte do que está preso ao perfil é prontuário,
 * bioimpedância e avaliação, com retenção obrigatória. Apagar o perfil aqui
 * cascatearia em 22 tabelas e destruiria o prontuário a partir de um botão no
 * celular do paciente.
 *
 * Então o que esta rota faz de verdade: registra a solicitação para a equipe
 * concluir e corta o acesso na hora (`is_active = false` + ban), que é o mesmo
 * padrão usado para revogar profissional em /api/admin/users.
 *
 * O que ficou de fora, de propósito: apagar as fotos do storage e as linhas do
 * banco. Ver docs/fotos-evolucao-bucket-privado.md.
 */

const BAN_FOREVER = '876600h' // ~100 anos, mesmo valor usado no painel admin

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('fitness_profiles')
      .select('role, nome, email')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ success: false, error: 'Perfil não encontrado' }, { status: 404 })
    }

    // Profissional e admin têm dado clínico e vínculos atrelados ao perfil;
    // desligar isso é operação do painel, não autoatendimento.
    if (profile.role !== 'client') {
      return NextResponse.json(
        { success: false, error: 'Contas da equipe são encerradas pelo painel administrativo. Fale com o suporte.' },
        { status: 403 }
      )
    }

    const { data: existing } = await supabaseAdmin
      .from('fitness_lgpd_requests')
      .select('id')
      .eq('user_id', user.id)
      .eq('request_type', 'deletion')
      .eq('status', 'pending')
      .maybeSingle()

    if (!existing) {
      const { error: requestError } = await supabaseAdmin
        .from('fitness_lgpd_requests')
        .insert({
          user_id: user.id,
          request_type: 'deletion',
          status: 'pending',
          notes: `Solicitado pelo próprio paciente (${profile.email ?? 'sem e-mail'}) pela tela de conta.`,
        })

      // Sem o registro não há o que a equipe concluir: falha aqui é falha do
      // pedido inteiro, não dá para cortar o acesso e perder a solicitação.
      if (requestError) {
        console.error('Erro ao registrar pedido de exclusão:', requestError)
        return NextResponse.json(
          { success: false, error: 'Não foi possível registrar o pedido. Tente de novo.' },
          { status: 500 }
        )
      }
    }

    const { error: deactivateError } = await supabaseAdmin
      .from('fitness_profiles')
      .update({ is_active: false })
      .eq('id', user.id)

    if (deactivateError) {
      console.error('Erro ao desativar perfil:', deactivateError)
      return NextResponse.json(
        { success: false, error: 'Não foi possível encerrar o acesso. Tente de novo.' },
        { status: 500 }
      )
    }

    const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      ban_duration: BAN_FOREVER,
    })

    if (banError) {
      console.error('Erro ao banir usuário:', banError)
      return NextResponse.json(
        { success: false, error: 'Não foi possível encerrar o acesso. Tente de novo.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro no pedido de exclusão de conta:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
