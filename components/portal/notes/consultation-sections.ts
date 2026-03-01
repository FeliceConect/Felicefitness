// Section definitions per professional type for consultations/prontuário

export interface ConsultationSection {
  key: 'anamnese' | 'exames' | 'diagnostico' | 'conduta'
  label: string
  placeholder: string
}

const NUTRI_SECTIONS: ConsultationSection[] = [
  { key: 'anamnese', label: 'Anamnese Nutricional', placeholder: 'Queixa principal, historico alimentar, habitos, alergias, intolerâncias...' },
  { key: 'exames', label: 'Exames Laboratoriais', placeholder: 'Resultados de exames, valores de referência, observações...' },
  { key: 'diagnostico', label: 'Diagnostico Nutricional', placeholder: 'Diagnostico nutricional baseado na avaliação...' },
  { key: 'conduta', label: 'Conduta', placeholder: 'Plano de ação, orientações, prescrições, retorno...' },
]

const COACH_SECTIONS: ConsultationSection[] = [
  { key: 'anamnese', label: 'Anamnese / Queixa Principal', placeholder: 'Motivo da consulta, queixa principal, contexto emocional, expectativas...' },
  { key: 'exames', label: 'Avaliação Comportamental', placeholder: 'Padrões comportamentais, crenças limitantes, recursos internos, pontos fortes...' },
  { key: 'diagnostico', label: 'Objetivos e Metas', placeholder: 'Objetivos terapêuticos, metas de curto e longo prazo, indicadores de progresso...' },
  { key: 'conduta', label: 'Plano de Ação', placeholder: 'Estratégias, tarefas para casa, técnicas recomendadas, próxima sessão...' },
]

const TRAINER_SECTIONS: ConsultationSection[] = [
  { key: 'anamnese', label: 'Anamnese / Histórico', placeholder: 'Histórico de treino, lesões, limitações, experiência prévia...' },
  { key: 'exames', label: 'Avaliação Física', placeholder: 'Testes de força, mobilidade, flexibilidade, postura, observações...' },
  { key: 'diagnostico', label: 'Diagnóstico Funcional', placeholder: 'Diagnóstico baseado na avaliação funcional e física...' },
  { key: 'conduta', label: 'Conduta / Prescrição', placeholder: 'Programa de treino, orientações, periodização, retorno...' },
]

const PHYSIO_SECTIONS: ConsultationSection[] = [
  { key: 'anamnese', label: 'Anamnese', placeholder: 'Queixa principal, histórico de dor, cirurgias, tratamentos anteriores...' },
  { key: 'exames', label: 'Exame Físico', placeholder: 'Avaliação postural, testes especiais, amplitude de movimento, palpação...' },
  { key: 'diagnostico', label: 'Diagnóstico Fisioterapêutico', placeholder: 'Diagnóstico cinético-funcional baseado na avaliação...' },
  { key: 'conduta', label: 'Conduta Terapêutica', placeholder: 'Plano de tratamento, técnicas, exercícios, frequência, retorno...' },
]

export function getSectionsForType(professionalType?: string): ConsultationSection[] {
  switch (professionalType) {
    case 'coach': return COACH_SECTIONS
    case 'trainer': return TRAINER_SECTIONS
    case 'physiotherapist': return PHYSIO_SECTIONS
    case 'nutritionist':
    default: return NUTRI_SECTIONS
  }
}

export function getConsultationLabel(professionalType?: string): string {
  switch (professionalType) {
    case 'coach': return 'Sessão'
    case 'trainer': return 'Avaliação'
    case 'physiotherapist': return 'Atendimento'
    case 'nutritionist':
    default: return 'Consulta'
  }
}
