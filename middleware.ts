import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - icons (PWA icons)
     * - manifest (PWA manifest)
     * - sw.js (service worker)
     * - workbox (workbox files)
     */
    '/((?!_next/static|_next/image|favicon.ico|icons|fonts|manifest|sw.js|workbox-.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?|ttf|otf|eot)$).*)',
  ],
}
