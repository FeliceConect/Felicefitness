import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Política de Privacidade - Complexo Wellness',
  description: 'Política de Privacidade e LGPD do aplicativo Complexo Wellness',
}

export default function PrivacidadePage() {
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
          <h1 className="text-2xl font-butler font-bold text-foreground">Política de Privacidade</h1>
        </div>

        {/* Content */}
        <div className="prose prose-slate max-w-none">
          <p className="text-sm text-foreground-muted mb-8">
            Última atualização: 27 de dezembro de 2024 | Versão: 1.0.0
          </p>

          <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 mb-8">
            <p className="text-foreground-secondary text-sm">
              Esta Política de Privacidade está em conformidade com a Lei Geral de Proteção
              de Dados (LGPD - Lei nº 13.709/2018) do Brasil.
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">1. Introdução</h2>
            <p className="text-foreground-secondary">
              A Complexo Wellness valoriza a privacidade de seus usuários. Esta Política de Privacidade
              descreve como coletamos, usamos, armazenamos e protegemos suas informações pessoais
              quando você usa nosso aplicativo.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">2. Dados Coletados</h2>
            <p className="text-foreground-secondary">Coletamos os seguintes tipos de dados:</p>

            <h3 className="text-lg font-medium text-foreground mt-4 mb-2">2.1 Dados Fornecidos por Você</h3>
            <ul className="list-disc list-inside text-foreground-secondary space-y-1">
              <li>Nome e email (cadastro)</li>
              <li>Data de nascimento, peso, altura e gênero</li>
              <li>Objetivos de fitness</li>
              <li>Registros de treinos e exercícios</li>
              <li>Registros de alimentação e refeições</li>
              <li>Registros de hidratação</li>
              <li>Registros de sono</li>
              <li>Dados de composição corporal (bioimpedância)</li>
              <li>Fotos de progresso (opcional)</li>
              <li>Mensagens em conversas com profissionais</li>
            </ul>

            <h3 className="text-lg font-medium text-foreground mt-4 mb-2">2.2 Dados Coletados Automaticamente</h3>
            <ul className="list-disc list-inside text-foreground-secondary space-y-1">
              <li>Endereço IP</li>
              <li>Tipo de dispositivo e navegador</li>
              <li>Sistema operacional</li>
              <li>Data e hora de acesso</li>
              <li>Páginas visitadas no aplicativo</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">3. Finalidade do Tratamento</h2>
            <p className="text-foreground-secondary">Seus dados são utilizados para:</p>
            <ul className="list-disc list-inside text-foreground-secondary mt-2 space-y-1">
              <li>Fornecer e manter o serviço do aplicativo</li>
              <li>Personalizar sua experiência de fitness</li>
              <li>Calcular métricas de saúde e progresso</li>
              <li>Gerar recomendações personalizadas</li>
              <li>Permitir comunicação com profissionais de saúde</li>
              <li>Enviar notificações relevantes (com seu consentimento)</li>
              <li>Melhorar nossos serviços</li>
              <li>Cumprir obrigações legais</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">4. Base Legal</h2>
            <p className="text-foreground-secondary">
              O tratamento dos seus dados é realizado com base nas seguintes hipóteses legais
              da LGPD:
            </p>
            <ul className="list-disc list-inside text-foreground-secondary mt-2 space-y-1">
              <li><strong>Consentimento:</strong> Para coleta de dados sensíveis de saúde</li>
              <li><strong>Execução de contrato:</strong> Para fornecer os serviços do aplicativo</li>
              <li><strong>Interesse legítimo:</strong> Para melhorar nossos serviços</li>
              <li><strong>Obrigação legal:</strong> Quando exigido por lei</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">5. Compartilhamento de Dados</h2>
            <p className="text-foreground-secondary">Seus dados podem ser compartilhados com:</p>
            <ul className="list-disc list-inside text-foreground-secondary mt-2 space-y-1">
              <li>
                <strong>Profissionais de saúde:</strong> Apenas os dados que você autorizar
                para acompanhamento profissional
              </li>
              <li>
                <strong>Provedores de serviço:</strong> Supabase (banco de dados),
                Vercel (hospedagem)
              </li>
              <li>
                <strong>Autoridades:</strong> Quando exigido por lei ou ordem judicial
              </li>
            </ul>
            <p className="text-foreground-secondary mt-2">
              NÃO vendemos seus dados pessoais para terceiros.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">6. Armazenamento e Segurança</h2>
            <p className="text-foreground-secondary">
              Seus dados são armazenados em servidores seguros com criptografia.
              Implementamos medidas técnicas e organizacionais para proteger seus dados,
              incluindo:
            </p>
            <ul className="list-disc list-inside text-foreground-secondary mt-2 space-y-1">
              <li>Criptografia em trânsito (HTTPS/TLS)</li>
              <li>Criptografia em repouso</li>
              <li>Controle de acesso baseado em funções</li>
              <li>Autenticação segura</li>
              <li>Backups regulares</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">7. Retenção de Dados</h2>
            <p className="text-foreground-secondary">
              Seus dados são mantidos enquanto sua conta estiver ativa ou conforme necessário
              para fornecer nossos serviços. Após a exclusão da conta, seus dados serão
              removidos em até 30 dias, exceto quando a retenção for exigida por lei.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">8. Seus Direitos (LGPD)</h2>
            <p className="text-foreground-secondary">
              Conforme a LGPD, você tem os seguintes direitos:
            </p>
            <ul className="list-disc list-inside text-foreground-secondary mt-2 space-y-1">
              <li><strong>Confirmação:</strong> Confirmar a existência de tratamento</li>
              <li><strong>Acesso:</strong> Acessar seus dados pessoais</li>
              <li><strong>Correção:</strong> Corrigir dados incompletos ou desatualizados</li>
              <li><strong>Anonimização:</strong> Solicitar anonimização de dados</li>
              <li><strong>Portabilidade:</strong> Exportar seus dados</li>
              <li><strong>Eliminação:</strong> Solicitar exclusão de dados</li>
              <li><strong>Informação:</strong> Saber com quem seus dados são compartilhados</li>
              <li><strong>Revogação:</strong> Revogar consentimento a qualquer momento</li>
            </ul>
            <p className="text-foreground-secondary mt-4">
              Para exercer seus direitos, acesse as{' '}
              <Link href="/configuracoes/privacidade" className="text-accent underline hover:text-accent/80">
                Configurações de Privacidade
              </Link>{' '}
              no aplicativo ou entre em contato conosco.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">9. Cookies</h2>
            <p className="text-foreground-secondary">
              Utilizamos cookies essenciais para o funcionamento do aplicativo, incluindo
              autenticação e preferências do usuário. Não utilizamos cookies de rastreamento
              de terceiros para publicidade.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">10. Menores de Idade</h2>
            <p className="text-foreground-secondary">
              O Complexo Wellness não é destinado a menores de 18 anos. Não coletamos intencionalmente
              dados de menores. Se tomarmos conhecimento de dados de um menor, eles serão
              excluídos imediatamente.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">11. Alterações</h2>
            <p className="text-foreground-secondary">
              Esta política pode ser atualizada periodicamente. Notificaremos sobre alterações
              significativas através do aplicativo. Recomendamos revisar esta política
              regularmente.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">12. Encarregado de Dados (DPO)</h2>
            <p className="text-foreground-secondary">
              Para questões relacionadas à proteção de dados, entre em contato com nosso
              Encarregado de Dados:
            </p>
            <p className="text-foreground-secondary mt-2">
              Email: dpo@feliceconect.com.br
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">13. Contato</h2>
            <p className="text-foreground-secondary">
              Para dúvidas sobre esta Política de Privacidade ou exercício de seus direitos:
            </p>
            <ul className="list-none text-foreground-secondary mt-2 space-y-1">
              <li>Email: privacidade@feliceconect.com.br</li>
              <li>Email geral: contato@feliceconect.com.br</li>
            </ul>
          </section>
        </div>

        {/* Back link */}
        <div className="mt-8 pt-8 border-t border-border">
          <Link
            href="/termos"
            className="text-accent hover:text-accent/80 transition-colors"
          >
            Ver Termos de Uso
          </Link>
        </div>
      </div>
    </div>
  )
}
