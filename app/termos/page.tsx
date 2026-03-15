import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Termos de Uso - Complexo Wellness',
  description: 'Termos de Uso do aplicativo Complexo Wellness',
}

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg bg-bg-elevated hover:bg-border transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <h1 className="text-2xl font-butler font-bold text-foreground">Termos de Uso</h1>
        </div>

        {/* Content */}
        <div className="prose prose-slate max-w-none">
          <p className="text-sm text-foreground-muted mb-8">
            Última atualização: 27 de dezembro de 2024 | Versão: 1.0.0
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">1. Aceitação dos Termos</h2>
            <p className="text-foreground-secondary">
              Ao acessar e usar o aplicativo Complexo Wellness, você concorda em cumprir e estar vinculado
              a estes Termos de Uso. Se você não concordar com qualquer parte destes termos,
              não deverá usar nosso aplicativo.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">2. Descrição do Serviço</h2>
            <p className="text-foreground-secondary">
              O Complexo Wellness é um aplicativo de acompanhamento de fitness e saúde que oferece:
            </p>
            <ul className="list-disc list-inside text-foreground-secondary mt-2 space-y-1">
              <li>Registro e acompanhamento de treinos</li>
              <li>Monitoramento de alimentação e nutrição</li>
              <li>Controle de hidratação</li>
              <li>Acompanhamento do sono</li>
              <li>Análise de composição corporal</li>
              <li>Sistema de gamificação e conquistas</li>
              <li>Comunicação com profissionais de saúde</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">3. Cadastro e Conta</h2>
            <p className="text-foreground-secondary">
              Para usar o Complexo Wellness, você deve criar uma conta fornecendo informações precisas
              e completas. Você é responsável por manter a confidencialidade de sua senha e
              por todas as atividades que ocorrem em sua conta.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">4. Uso Adequado</h2>
            <p className="text-foreground-secondary">Você concorda em não:</p>
            <ul className="list-disc list-inside text-foreground-secondary mt-2 space-y-1">
              <li>Usar o aplicativo para qualquer finalidade ilegal</li>
              <li>Compartilhar sua conta com terceiros</li>
              <li>Tentar acessar áreas restritas do sistema</li>
              <li>Enviar conteúdo ofensivo, difamatório ou inapropriado</li>
              <li>Interferir no funcionamento do aplicativo</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">5. Aviso de Saúde</h2>
            <p className="text-foreground-secondary">
              O Complexo Wellness fornece informações gerais sobre fitness e saúde, mas NÃO substitui
              aconselhamento médico profissional. Antes de iniciar qualquer programa de exercícios
              ou dieta, consulte um profissional de saúde qualificado.
            </p>
            <p className="text-foreground-secondary mt-2">
              As informações nutricionais são apenas orientativas
              e podem conter imprecisões. Sempre verifique as informações nutricionais com
              fontes confiáveis.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">6. Propriedade Intelectual</h2>
            <p className="text-foreground-secondary">
              Todo o conteúdo do Complexo Wellness, incluindo textos, gráficos, logos, ícones e software,
              é propriedade da Complexo Wellness ou de seus licenciadores e está protegido por leis de
              propriedade intelectual.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">7. Limitação de Responsabilidade</h2>
            <p className="text-foreground-secondary">
              O Complexo Wellness é fornecido &quot;como está&quot;, sem garantias de qualquer tipo. Não nos
              responsabilizamos por lesões, problemas de saúde ou quaisquer danos resultantes
              do uso do aplicativo.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">8. Modificações</h2>
            <p className="text-foreground-secondary">
              Reservamo-nos o direito de modificar estes termos a qualquer momento. As alterações
              entram em vigor imediatamente após a publicação. O uso continuado do aplicativo
              após as alterações constitui aceitação dos novos termos.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">9. Encerramento</h2>
            <p className="text-foreground-secondary">
              Podemos suspender ou encerrar sua conta a qualquer momento, por qualquer motivo,
              incluindo violação destes termos. Você também pode encerrar sua conta a qualquer
              momento através das configurações do aplicativo.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">10. Lei Aplicável</h2>
            <p className="text-foreground-secondary">
              Estes termos são regidos pelas leis do Brasil. Qualquer disputa será resolvida
              nos tribunais competentes da cidade de São Paulo, SP.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">11. Contato</h2>
            <p className="text-foreground-secondary">
              Para dúvidas sobre estes Termos de Uso, entre em contato conosco através do
              email: contato@feliceconect.com.br
            </p>
          </section>
        </div>

        {/* Back link */}
        <div className="mt-8 pt-8 border-t border-border">
          <Link
            href="/privacidade"
            className="text-accent hover:text-accent/80 transition-colors"
          >
            Ver Política de Privacidade
          </Link>
        </div>
      </div>
    </div>
  )
}
