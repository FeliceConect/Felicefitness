import type { Metadata, Viewport } from "next"
import { Sarabun } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { SkipLink } from "@/components/ui/accessibility/skip-link"
import { AnnouncerProvider } from "@/components/ui/accessibility/announcer"
import { Providers } from "./providers"

const sarabun = Sarabun({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-sarabun",
})

export const metadata: Metadata = {
  title: "Complexo Wellness - Programa de Acompanhamento",
  description: "Plataforma digital do programa de acompanhamento wellness do Complexo Felice.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Complexo Wellness",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: "#f7f2ed",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${sarabun.variable} font-sans antialiased`}>
        <SkipLink />
        <Providers>
          <AnnouncerProvider>
            <main id="main-content">
              {children}
            </main>
          </AnnouncerProvider>
        </Providers>
        <Toaster />
        <SonnerToaster
          position="top-center"
          toastOptions={{
            style: {
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              color: 'hsl(var(--foreground))',
            }
          }}
        />
      </body>
    </html>
  )
}
