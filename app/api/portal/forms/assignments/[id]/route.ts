/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// DELETE - Remover formulário enviado que ainda não foi preenchido
// Permitido apenas se status in ('pending', 'in_progress').
// O próprio profissional dono do envio OU super_admin pode deletar.
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const supabaseAdmin = getAdminClient()
    const assignmentId = params.id

    // Buscar assignment
    const { data: assignment, error: assignmentError } = await supabaseAdmin
      .from('fitness_form_assignments')
      .select('id, professional_id, status')
      .eq('id', assignmentId)
      .single()

    if (assignmentError || !assignment) {
      return NextResponse.json({ success: false, error: 'Formulário não encontrado' }, { status: 404 })
    }

    // Validar status: só pode apagar se ainda não preenchido
    if (assignment.status !== 'pending' && assignment.status !== 'in_progress') {
      return NextResponse.json({
        success: false,
        error: 'Não é possível remover: este formulário já foi preenchido ou expirado.',
      }, { status: 409 })
    }

    // Validar permissão: dono ou super_admin
    const { data: profile } = await supabaseAdmin
      .from('fitness_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isSuperAdmin = profile?.role === 'super_admin'

    if (!isSuperAdmin) {
      const { data: professional } = await supabaseAdmin
        .from('fitness_professionals')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!professional || professional.id !== assignment.professional_id) {
        return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 })
      }
    }

    // Deletar assignment (respostas e drafts têm ON DELETE CASCADE)
    const { error: deleteError } = await supabaseAdmin
      .from('fitness_form_assignments')
      .delete()
      .eq('id', assignmentId)

    if (deleteError) {
      console.error('Erro ao deletar assignment:', deleteError)
      return NextResponse.json({ success: false, error: 'Erro ao remover formulário' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Formulário removido' })
  } catch (error) {
    console.error('Erro na API de assignment (DELETE):', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
