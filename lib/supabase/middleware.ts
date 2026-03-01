import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Rotas públicas que não precisam de autenticação
  const publicRoutes = ['/login', '/registro', '/termos', '/privacidade']
  const isPublicRoute = publicRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )

  // Rotas que não devem verificar onboarding
  const onboardingExemptRoutes = ['/onboarding', '/api', '/termos', '/privacidade', '/portal']
  const isOnboardingExempt = onboardingExemptRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )

  // Rotas do portal (exclusivas para profissionais)
  const isPortalRoute = request.nextUrl.pathname.startsWith('/portal')

  // Rotas do app (exclusivas para pacientes)
  const appRoutes = ['/dashboard', '/treino', '/alimentacao', '/hidratacao', '/agua', '/fotos', '/bioimpedancia', '/sono', '/bem-estar', '/perfil', '/configuracoes', '/relatorios', '/agenda', '/feed', '/ranking', '/chat', '/mensagens', '/compartilhar', '/notificacoes', '/corpo', '/formularios', '/conquistas']
  const isAppRoute = appRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )

  // Se não está autenticado e tentando acessar rota protegida
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Rotas do admin
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')

  // Verificar se é profissional (personal, nutricionista ou coach)
  let isProfessional = false
  let isAdminUser = false
  let profile: { role: string; onboarding_completed: boolean } | null = null

  if (user) {
    const { data: profileData } = await supabase
      .from('fitness_profiles')
      .select('role, onboarding_completed')
      .eq('id', user.id)
      .single()

    profile = profileData

    if (profile?.role === 'super_admin' || profile?.role === 'admin') {
      isAdminUser = true
    }

    const { data: professional } = await supabase
      .from('fitness_professionals')
      .select('id, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    if (professional) {
      isProfessional = true
    }
  }

  // Se está autenticado e tentando acessar rota pública (login/registro)
  if (user && (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/registro'))) {
    const url = request.nextUrl.clone()
    // Profissionais vão direto para o portal
    url.pathname = isProfessional ? '/portal' : '/dashboard'
    return NextResponse.redirect(url)
  }

  // Se é profissional tentando acessar rotas do app, redirecionar para o portal
  if (user && isProfessional && isAppRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/portal'
    return NextResponse.redirect(url)
  }

  // Se NÃO é profissional tentando acessar portal, redirecionar para o app
  if (user && !isProfessional && isPortalRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Se NÃO é admin tentando acessar admin, redirecionar
  if (user && !isAdminUser && isAdminRoute) {
    const url = request.nextUrl.clone()
    url.pathname = isProfessional ? '/portal' : '/dashboard'
    return NextResponse.redirect(url)
  }

  // Se está autenticado (usuário comum), verificar se completou o onboarding
  if (user && !isProfessional && !isAdminUser && !isOnboardingExempt) {
    if (profile && profile.onboarding_completed === false) {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
