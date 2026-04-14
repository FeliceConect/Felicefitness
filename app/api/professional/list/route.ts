import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// GET - Listar todos os profissionais ativos (admin/super_admin only)
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Verificar se e admin/super_admin
    const { data: profile } = await supabaseAdmin
      .from('fitness_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['super_admin', 'admin'].includes(profile.role)) {
      return NextResponse.json(
        { success: false, error: 'Acesso restrito a administradores' },
        { status: 403 }
      )
    }

    // Buscar todos os profissionais ativos
    const { data: professionals, error } = await supabaseAdmin
      .from('fitness_professionals')
      .select('id, user_id, type, display_name, specialty, is_active')
      .eq('is_active', true)
      .order('display_name', { ascending: true })

    if (error) {
      console.error('Erro ao buscar profissionais:', error)
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar profissionais' },
        { status: 500 }
      )
    }

    // Buscar nomes do perfil para profissionais sem display_name
    const userIds = professionals?.filter(p => !p.display_name).map(p => p.user_id) || []
    const profilesMap: Record<string, string> = {}

    if (userIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('fitness_profiles')
        .select('id, nome')
        .in('id', userIds)

      profiles?.forEach(p => {
        profilesMap[p.id] = p.nome
      })
    }

    const data = professionals?.map(p => ({
      id: p.id,
      display_name: p.display_name || profilesMap[p.user_id] || 'Profissional',
      type: p.type,
      specialty: p.specialty,
    })) || []

    // Incluir superadmins como "Líder" — auto-criar registro em fitness_professionals se não existir
    const { data: superAdmins } = await supabaseAdmin
      .from('fitness_profiles')
      .select('id, nome, display_name')
      .eq('role', 'super_admin')
      .order('nome', { ascending: true })

    const superAdminEntries = []
    for (const sa of (superAdmins || [])) {
      // Verificar se já tem registro em fitness_professionals
      const existing = professionals?.find(p => p.user_id === sa.id)
      if (existing) continue // Já está na lista de profissionais

      // Auto-criar registro de profissional "Líder" para o superadmin
      const { data: existingProf } = await supabaseAdmin
        .from('fitness_professionals')
        .select('id, type, display_name, specialty')
        .eq('user_id', sa.id)
        .maybeSingle()

      if (existingProf) {
        superAdminEntries.push({
          id: existingProf.id,
          display_name: existingProf.display_name || sa.nome || 'Líder',
          type: existingProf.type,
          specialty: existingProf.specialty,
        })
      } else {
        const { data: created } = await supabaseAdmin
          .from('fitness_professionals')
          .insert({
            user_id: sa.id,
            type: 'super_admin',
            display_name: sa.display_name || sa.nome || 'Líder',
            specialty: 'Coordenação',
            is_active: true,
            max_clients: 100,
          })
          .select('id, type, display_name, specialty')
          .single()

        if (created) {
          superAdminEntries.push({
            id: created.id,
            display_name: created.display_name || sa.nome || 'Líder',
            type: created.type,
            specialty: created.specialty,
          })
        }
      }
    }

    return NextResponse.json({ success: true, data: [...superAdminEntries, ...data] })

  } catch (error) {
    console.error('Erro ao buscar lista de profissionais:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
