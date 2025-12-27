import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Politica de Privacidade - FeliceFit',
  description: 'Politica de Privacidade e LGPD do aplicativo FeliceFit',
}

export default function PrivacidadePage() {
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
          <h1 className="text-2xl font-bold text-white">Politica de Privacidade</h1>
        </div>

        {/* Content */}
        <div className="prose prose-invert prose-slate max-w-none">
          <p className="text-sm text-slate-400 mb-8">
            Ultima atualizacao: 27 de dezembro de 2024 | Versao: 1.0.0
          </p>

          <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-4 mb-8">
            <p className="text-violet-300 text-sm">
              Esta Politica de Privacidade esta em conformidade com a Lei Geral de Protecao
              de Dados (LGPD - Lei n. 13.709/2018) do Brasil.
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">1. Introducao</h2>
            <p className="text-slate-300">
              A FeliceFit valoriza a privacidade de seus usuarios. Esta Politica de Privacidade
              descreve como coletamos, usamos, armazenamos e protegemos suas informacoes pessoais
              quando voce usa nosso aplicativo.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">2. Dados Coletados</h2>
            <p className="text-slate-300">Coletamos os seguintes tipos de dados:</p>

            <h3 className="text-lg font-medium text-white mt-4 mb-2">2.1 Dados Fornecidos por Voce</h3>
            <ul className="list-disc list-inside text-slate-300 space-y-1">
              <li>Nome e email (cadastro)</li>
              <li>Data de nascimento, peso, altura e genero</li>
              <li>Objetivos de fitness</li>
              <li>Registros de treinos e exercicios</li>
              <li>Registros de alimentacao e refeicoes</li>
              <li>Registros de hidratacao</li>
              <li>Registros de sono</li>
              <li>Dados de composicao corporal (bioimpedancia)</li>
              <li>Fotos de progresso (opcional)</li>
              <li>Fotos de alimentos para analise por IA</li>
              <li>Mensagens enviadas para o Coach IA</li>
              <li>Mensagens em conversas com profissionais</li>
            </ul>

            <h3 className="text-lg font-medium text-white mt-4 mb-2">2.2 Dados Coletados Automaticamente</h3>
            <ul className="list-disc list-inside text-slate-300 space-y-1">
              <li>Endereco IP</li>
              <li>Tipo de dispositivo e navegador</li>
              <li>Sistema operacional</li>
              <li>Data e hora de acesso</li>
              <li>Paginas visitadas no aplicativo</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">3. Finalidade do Tratamento</h2>
            <p className="text-slate-300">Seus dados sao utilizados para:</p>
            <ul className="list-disc list-inside text-slate-300 mt-2 space-y-1">
              <li>Fornecer e manter o servico do aplicativo</li>
              <li>Personalizar sua experiencia de fitness</li>
              <li>Calcular metricas de saude e progresso</li>
              <li>Gerar insights e recomendacoes personalizadas</li>
              <li>Fornecer sugestoes do Coach IA</li>
              <li>Analisar alimentos atraves de fotos</li>
              <li>Permitir comunicacao com profissionais de saude</li>
              <li>Enviar notificacoes relevantes (com seu consentimento)</li>
              <li>Melhorar nossos servicos</li>
              <li>Cumprir obrigacoes legais</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">4. Base Legal</h2>
            <p className="text-slate-300">
              O tratamento dos seus dados e realizado com base nas seguintes hipoteses legais
              da LGPD:
            </p>
            <ul className="list-disc list-inside text-slate-300 mt-2 space-y-1">
              <li><strong>Consentimento:</strong> Para coleta de dados sensiveis de saude</li>
              <li><strong>Execucao de contrato:</strong> Para fornecer os servicos do aplicativo</li>
              <li><strong>Interesse legitimo:</strong> Para melhorar nossos servicos</li>
              <li><strong>Obrigacao legal:</strong> Quando exigido por lei</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">5. Compartilhamento de Dados</h2>
            <p className="text-slate-300">Seus dados podem ser compartilhados com:</p>
            <ul className="list-disc list-inside text-slate-300 mt-2 space-y-1">
              <li>
                <strong>Profissionais de saude:</strong> Apenas os dados que voce autorizar
                para acompanhamento profissional
              </li>
              <li>
                <strong>Provedores de servico:</strong> Supabase (banco de dados), OpenAI
                (analise de IA), Vercel (hospedagem)
              </li>
              <li>
                <strong>Autoridades:</strong> Quando exigido por lei ou ordem judicial
              </li>
            </ul>
            <p className="text-slate-300 mt-2">
              NAO vendemos seus dados pessoais para terceiros.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">6. Armazenamento e Seguranca</h2>
            <p className="text-slate-300">
              Seus dados sao armazenados em servidores seguros com criptografia.
              Implementamos medidas tecnicas e organizacionais para proteger seus dados,
              incluindo:
            </p>
            <ul className="list-disc list-inside text-slate-300 mt-2 space-y-1">
              <li>Criptografia em transito (HTTPS/TLS)</li>
              <li>Criptografia em repouso</li>
              <li>Controle de acesso baseado em funcoes</li>
              <li>Autenticacao segura</li>
              <li>Backups regulares</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">7. Retencao de Dados</h2>
            <p className="text-slate-300">
              Seus dados sao mantidos enquanto sua conta estiver ativa ou conforme necessario
              para fornecer nossos servicos. Apos a exclusao da conta, seus dados serao
              removidos em ate 30 dias, exceto quando a retencao for exigida por lei.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">8. Seus Direitos (LGPD)</h2>
            <p className="text-slate-300">
              Conforme a LGPD, voce tem os seguintes direitos:
            </p>
            <ul className="list-disc list-inside text-slate-300 mt-2 space-y-1">
              <li><strong>Confirmacao:</strong> Confirmar a existencia de tratamento</li>
              <li><strong>Acesso:</strong> Acessar seus dados pessoais</li>
              <li><strong>Correcao:</strong> Corrigir dados incompletos ou desatualizados</li>
              <li><strong>Anonimizacao:</strong> Solicitar anonimizacao de dados</li>
              <li><strong>Portabilidade:</strong> Exportar seus dados</li>
              <li><strong>Eliminacao:</strong> Solicitar exclusao de dados</li>
              <li><strong>Informacao:</strong> Saber com quem seus dados sao compartilhados</li>
              <li><strong>Revogacao:</strong> Revogar consentimento a qualquer momento</li>
            </ul>
            <p className="text-slate-300 mt-4">
              Para exercer seus direitos, acesse as{' '}
              <Link href="/configuracoes/privacidade" className="text-violet-400 underline">
                Configuracoes de Privacidade
              </Link>{' '}
              no aplicativo ou entre em contato conosco.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">9. Uso de IA</h2>
            <p className="text-slate-300">
              O FeliceFit utiliza inteligencia artificial (OpenAI GPT-4) para:
            </p>
            <ul className="list-disc list-inside text-slate-300 mt-2 space-y-1">
              <li>Analisar fotos de alimentos e estimar valores nutricionais</li>
              <li>Fornecer orientacoes personalizadas atraves do Coach IA</li>
              <li>Gerar insights sobre seu progresso</li>
            </ul>
            <p className="text-slate-300 mt-2">
              As imagens e textos enviados para analise de IA sao processados pela OpenAI.
              Recomendamos nao enviar informacoes sensiveis alem do necessario.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">10. Cookies</h2>
            <p className="text-slate-300">
              Utilizamos cookies essenciais para o funcionamento do aplicativo, incluindo
              autenticacao e preferencias do usuario. Nao utilizamos cookies de rastreamento
              de terceiros para publicidade.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">11. Menores de Idade</h2>
            <p className="text-slate-300">
              O FeliceFit nao e destinado a menores de 18 anos. Nao coletamos intencionalmente
              dados de menores. Se tomarmos conhecimento de dados de um menor, eles serao
              excluidos imediatamente.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">12. Alteracoes</h2>
            <p className="text-slate-300">
              Esta politica pode ser atualizada periodicamente. Notificaremos sobre alteracoes
              significativas atraves do aplicativo. Recomendamos revisar esta politica
              regularmente.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">13. Encarregado de Dados (DPO)</h2>
            <p className="text-slate-300">
              Para questoes relacionadas a protecao de dados, entre em contato com nosso
              Encarregado de Dados:
            </p>
            <p className="text-slate-300 mt-2">
              Email: dpo@felicefit.com.br
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">14. Contato</h2>
            <p className="text-slate-300">
              Para duvidas sobre esta Politica de Privacidade ou exercicio de seus direitos:
            </p>
            <ul className="list-none text-slate-300 mt-2 space-y-1">
              <li>Email: privacidade@felicefit.com.br</li>
              <li>Email geral: contato@felicefit.com.br</li>
            </ul>
          </section>
        </div>

        {/* Back link */}
        <div className="mt-8 pt-8 border-t border-slate-800">
          <Link
            href="/termos"
            className="text-violet-400 hover:text-violet-300 transition-colors"
          >
            Ver Termos de Uso
          </Link>
        </div>
      </div>
    </div>
  )
}
