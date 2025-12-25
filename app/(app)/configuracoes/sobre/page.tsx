'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Heart, ExternalLink, Bug, MessageSquare, Star, Globe, Coffee } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function SobrePage() {
  const router = useRouter()

  const APP_VERSION = '1.0.0'

  const technologies = [
    'Next.js 14',
    'React',
    'TypeScript',
    'Tailwind CSS',
    'Supabase',
    'OpenAI GPT-4',
    'Recharts',
    'PWA'
  ]

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="flex items-center gap-3 p-4">
          <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-muted rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-semibold">Sobre</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* App Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              {/* Logo */}
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-4xl">🏋️‍♂️</span>
              </div>

              <h2 className="text-2xl font-bold">FeliceFit</h2>
              <p className="text-muted-foreground">Versão {APP_VERSION}</p>

              <p className="mt-4 text-sm text-muted-foreground max-w-xs">
                Seu app de fitness pessoal completo para treino, nutrição,
                hidratação e acompanhamento de progresso.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Developer */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Desenvolvido por</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-xl">
                👨‍💻
              </div>
              <div className="flex-1">
                <p className="font-semibold">Leonardo Felice</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  Com <Heart className="h-3 w-3 text-red-500 inline" /> e muito <Coffee className="h-3 w-3 inline" />
                </p>
              </div>
            </div>
            <a
              href="https://feliceconect.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex items-center justify-center gap-2 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
            >
              <Globe className="h-4 w-4" />
              <span className="text-sm">feliceconect.com.br</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </CardContent>
        </Card>

        {/* Technologies */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tecnologias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {technologies.map((tech) => (
                <span
                  key={tech}
                  className="px-3 py-1 bg-muted rounded-full text-sm"
                >
                  {tech}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Links */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <a
              href="mailto:feedback@feliceconect.com.br"
              className="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
            >
              <MessageSquare className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="font-medium">Enviar feedback</p>
                <p className="text-xs text-muted-foreground">Sugestões e melhorias</p>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>

            <a
              href="mailto:bugs@feliceconect.com.br"
              className="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
            >
              <Bug className="h-5 w-5 text-orange-500" />
              <div className="flex-1">
                <p className="font-medium">Reportar bug</p>
                <p className="text-xs text-muted-foreground">Encontrou um problema?</p>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>

            <button
              onClick={() => {
                // Would open app store rating
                alert('Obrigado! Avaliação em breve disponível.')
              }}
              className="w-full flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
            >
              <Star className="h-5 w-5 text-yellow-500" />
              <div className="flex-1 text-left">
                <p className="font-medium">Avaliar o app</p>
                <p className="text-xs text-muted-foreground">Deixe sua avaliação</p>
              </div>
            </button>
          </CardContent>
        </Card>

        {/* Legal */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Legal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <button className="w-full flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
              <span className="text-sm">Termos de Uso</span>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </button>
            <button className="w-full flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
              <span className="text-sm">Política de Privacidade</span>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </button>
            <button className="w-full flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
              <span className="text-sm">Licenças Open Source</span>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </button>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center space-y-2 pt-4">
          <p className="text-sm text-muted-foreground">
            © 2024 FeliceFit. Todos os direitos reservados.
          </p>
          <p className="text-xs text-muted-foreground">
            Feito com ❤️ no Brasil
          </p>
        </div>
      </div>
    </div>
  )
}
