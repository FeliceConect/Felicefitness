import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Termos de Uso - Complexo Wellness',
  description: 'Termos de Uso do aplicativo Complexo Wellness',
}

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <h1 className="text-2xl font-bold text-white">Termos de Uso</h1>
        </div>

        {/* Content */}
        <div className="prose prose-invert prose-slate max-w-none">
          <p className="text-sm text-slate-400 mb-8">
            Ultima atualizacao: 27 de dezembro de 2024 | Versao: 1.0.0
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">1. Aceitacao dos Termos</h2>
            <p className="text-slate-300">
              Ao acessar e usar o aplicativo Complexo Wellness, voce concorda em cumprir e estar vinculado
              a estes Termos de Uso. Se voce nao concordar com qualquer parte destes termos,
              nao devera usar nosso aplicativo.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">2. Descricao do Servico</h2>
            <p className="text-slate-300">
              O Complexo Wellness e um aplicativo de acompanhamento de fitness e saude que oferece:
            </p>
            <ul className="list-disc list-inside text-slate-300 mt-2 space-y-1">
              <li>Registro e acompanhamento de treinos</li>
              <li>Monitoramento de alimentacao e nutricao</li>
              <li>Controle de hidratacao</li>
              <li>Acompanhamento do sono</li>
              <li>Analise de composicao corporal</li>
              <li>Sistema de gamificacao e conquistas</li>
              <li>Coach de IA personalizado</li>
              <li>Comunicacao com profissionais de saude</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">3. Cadastro e Conta</h2>
            <p className="text-slate-300">
              Para usar o Complexo Wellness, voce deve criar uma conta fornecendo informacoes precisas
              e completas. Voce e responsavel por manter a confidencialidade de sua senha e
              por todas as atividades que ocorrem em sua conta.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">4. Uso Adequado</h2>
            <p className="text-slate-300">Voce concorda em nao:</p>
            <ul className="list-disc list-inside text-slate-300 mt-2 space-y-1">
              <li>Usar o aplicativo para qualquer finalidade ilegal</li>
              <li>Compartilhar sua conta com terceiros</li>
              <li>Tentar acessar areas restritas do sistema</li>
              <li>Enviar conteudo ofensivo, difamatorio ou inapropriado</li>
              <li>Interferir no funcionamento do aplicativo</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">5. Aviso de Saude</h2>
            <p className="text-slate-300">
              O Complexo Wellness fornece informacoes gerais sobre fitness e saude, mas NAO substitui
              aconselhamento medico profissional. Antes de iniciar qualquer programa de exercicios
              ou dieta, consulte um profissional de saude qualificado.
            </p>
            <p className="text-slate-300 mt-2">
              A analise de alimentos por IA e as sugestoes do Coach IA sao apenas orientativas
              e podem conter imprecisoes. Sempre verifique as informacoes nutricionais com
              fontes confiavei.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">6. Propriedade Intelectual</h2>
            <p className="text-slate-300">
              Todo o conteudo do Complexo Wellness, incluindo textos, graficos, logos, icones e software,
              e propriedade da Complexo Wellness ou de seus licenciadores e esta protegido por leis de
              propriedade intelectual.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">7. Limitacao de Responsabilidade</h2>
            <p className="text-slate-300">
              O Complexo Wellness e fornecido &quot;como esta&quot;, sem garantias de qualquer tipo. Nao nos
              responsabilizamos por lesoes, problemas de saude ou quaisquer danos resultantes
              do uso do aplicativo.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">8. Modificacoes</h2>
            <p className="text-slate-300">
              Reservamo-nos o direito de modificar estes termos a qualquer momento. As alteracoes
              entram em vigor imediatamente apos a publicacao. O uso continuado do aplicativo
              apos as alteracoes constitui aceitacao dos novos termos.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">9. Encerramento</h2>
            <p className="text-slate-300">
              Podemos suspender ou encerrar sua conta a qualquer momento, por qualquer motivo,
              incluindo violacao destes termos. Voce tambem pode encerrar sua conta a qualquer
              momento atraves das configuracoes do aplicativo.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">10. Lei Aplicavel</h2>
            <p className="text-slate-300">
              Estes termos sao regidos pelas leis do Brasil. Qualquer disputa sera resolvida
              nos tribunais competentes da cidade de Sao Paulo, SP.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">11. Contato</h2>
            <p className="text-slate-300">
              Para duvidas sobre estes Termos de Uso, entre em contato conosco atraves do
              email: contato@felicefit.com.br
            </p>
          </section>
        </div>

        {/* Back link */}
        <div className="mt-8 pt-8 border-t border-slate-800">
          <Link
            href="/privacidade"
            className="text-violet-400 hover:text-violet-300 transition-colors"
          >
            Ver Politica de Privacidade
          </Link>
        </div>
      </div>
    </div>
  )
}
