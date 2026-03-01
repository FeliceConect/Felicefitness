// Complexo Wellness - Tipos para Sistema de Formulários Pré-Consulta

// ============================================
// TIPOS DE PERGUNTA
// ============================================

export type QuestionType =
  | 'short_text'
  | 'long_text'
  | 'number'
  | 'scale'
  | 'single_choice'
  | 'multiple_choice'
  | 'dropdown'
  | 'yes_no'
  | 'date'
  | 'consent'
  | 'section_header'

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  short_text: 'Texto Curto',
  long_text: 'Texto Longo',
  number: 'Número',
  scale: 'Escala',
  single_choice: 'Escolha Única',
  multiple_choice: 'Múltipla Escolha',
  dropdown: 'Dropdown',
  yes_no: 'Sim/Não',
  date: 'Data',
  consent: 'Consentimento',
  section_header: 'Cabeçalho de Seção',
}

export const QUESTION_TYPE_ICONS: Record<QuestionType, string> = {
  short_text: 'Type',
  long_text: 'AlignLeft',
  number: 'Hash',
  scale: 'SlidersHorizontal',
  single_choice: 'CircleDot',
  multiple_choice: 'CheckSquare',
  dropdown: 'ChevronDown',
  yes_no: 'ToggleLeft',
  date: 'Calendar',
  consent: 'ShieldCheck',
  section_header: 'Heading',
}

// ============================================
// ESPECIALIDADE E TIPO DE FORMULÁRIO
// ============================================

export type FormSpecialty = 'trainer' | 'nutritionist' | 'coach'

export const FORM_SPECIALTY_LABELS: Record<FormSpecialty, string> = {
  trainer: 'Personal Trainer',
  nutritionist: 'Nutricionista',
  coach: 'Coach',
}

export type FormType =
  | 'initial_assessment'
  | 'weekly_checkin'
  | 'progress_review'
  | 'food_recall'
  | 'custom'

export const FORM_TYPE_LABELS: Record<FormType, string> = {
  initial_assessment: 'Anamnese Inicial',
  weekly_checkin: 'Check-in Semanal',
  progress_review: 'Avaliação de Progresso',
  food_recall: 'Recordatório Alimentar',
  custom: 'Personalizado',
}

// ============================================
// STATUS DO ASSIGNMENT
// ============================================

export type FormAssignmentStatus = 'pending' | 'in_progress' | 'completed' | 'expired'

export const FORM_STATUS_LABELS: Record<FormAssignmentStatus, string> = {
  pending: 'Pendente',
  in_progress: 'Em Preenchimento',
  completed: 'Preenchido',
  expired: 'Expirado',
}

export const FORM_STATUS_COLORS: Record<FormAssignmentStatus, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  in_progress: 'bg-blue-500/20 text-blue-400',
  completed: 'bg-green-500/20 text-green-400',
  expired: 'bg-red-500/20 text-red-400',
}

// ============================================
// OPÇÕES E CONFIGURAÇÃO DE PERGUNTAS
// ============================================

export interface QuestionOption {
  value: string
  label: string
}

export interface QuestionConfig {
  // number
  min?: number
  max?: number
  step?: number
  unit?: string
  // scale
  minLabel?: string
  maxLabel?: string
  // short_text / long_text
  placeholder?: string
  maxLength?: number
  // consent
  consentText?: string
  // section_header
  subtitle?: string
}

export interface ConditionalLogic {
  questionId: string
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than'
  value: string | number | boolean
}

// ============================================
// ENTIDADES PRINCIPAIS
// ============================================

export interface FormTemplate {
  id: string
  professional_id: string | null
  name: string
  description: string | null
  specialty: FormSpecialty
  form_type: FormType
  is_system_template: boolean
  is_active: boolean
  version: number
  created_at: string
  updated_at: string
}

export interface FormQuestion {
  id: string
  template_id: string
  question_text: string
  question_type: QuestionType
  options: QuestionOption[] | null
  config: QuestionConfig
  is_required: boolean
  order_index: number
  section: string | null
  conditional_on: ConditionalLogic | null
  created_at: string
}

export interface FormAssignment {
  id: string
  template_id: string
  template_version: number
  professional_id: string
  client_id: string
  status: FormAssignmentStatus
  due_date: string | null
  sent_at: string
  started_at: string | null
  completed_at: string | null
  reminder_sent: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface FormResponse {
  id: string
  assignment_id: string
  question_id: string
  question_snapshot: FormQuestion
  response_value: ResponseValue
  responded_at: string
}

export interface FormDraft {
  id: string
  assignment_id: string
  client_id: string
  draft_data: Record<string, ResponseValue>
  current_step: number
  updated_at: string
}

// ============================================
// VALORES DE RESPOSTA
// ============================================

export type ResponseValue =
  | { value: string }
  | { value: number }
  | { value: boolean }
  | { values: string[] }

// ============================================
// TIPOS COMPOSTOS (com joins)
// ============================================

export interface FormTemplateWithQuestions extends FormTemplate {
  questions: FormQuestion[]
}

export interface FormAssignmentWithDetails extends FormAssignment {
  template: FormTemplate
  questions: FormQuestion[]
  professional?: {
    id: string
    display_name: string
    type: string
  }
  client?: {
    id: string
    nome: string
    email: string
  }
}

export interface FormAssignmentWithResponses extends FormAssignment {
  template: FormTemplate
  questions: FormQuestion[]
  responses: FormResponse[]
}

export interface FormResponseGrouped {
  question: FormQuestion
  response: FormResponse | null
}

// ============================================
// PAYLOADS DE API
// ============================================

export interface AssignFormPayload {
  templateId: string
  clientIds: string[]
  dueDate?: string
  notes?: string
}

export interface SubmitFormPayload {
  assignmentId: string
  responses: {
    questionId: string
    value: ResponseValue
  }[]
}

export interface SaveDraftPayload {
  assignmentId: string
  draftData: Record<string, ResponseValue>
  currentStep: number
}

// ============================================
// WIZARD STATE
// ============================================

export interface FormWizardState {
  currentStep: number
  totalSteps: number
  sections: FormWizardSection[]
  responses: Record<string, ResponseValue>
  isSubmitting: boolean
  isSaving: boolean
  lastSavedAt: string | null
}

export interface FormWizardSection {
  title: string
  subtitle?: string
  questions: FormQuestion[]
}
