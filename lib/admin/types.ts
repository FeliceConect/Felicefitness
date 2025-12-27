// Tipos para o módulo administrativo

// Roles disponíveis no sistema
export type UserRole = 'super_admin' | 'admin' | 'nutritionist' | 'trainer' | 'client'

// Tipos de profissionais
export type ProfessionalType = 'nutritionist' | 'trainer'

// Profissional
export interface Professional {
  id: string
  user_id: string
  type: ProfessionalType
  registration?: string // CRN ou CREF
  specialty?: string
  bio?: string
  max_clients: number
  is_active: boolean
  created_at: string
  updated_at: string
  // Dados do perfil (quando join com fitness_profiles)
  profile?: {
    nome: string
    email: string
  }
}

// Atribuição cliente-profissional
export interface ClientAssignment {
  id: string
  client_id: string
  professional_id: string
  assigned_at: string
  assigned_by?: string
  notes?: string
  is_active: boolean
  created_at: string
  // Dados relacionados (quando join)
  client?: {
    nome: string
    email: string
  }
  professional?: Professional
}

// Aceite de termos
export interface TermsAcceptance {
  id: string
  user_id: string
  version: string
  accepted_at: string
  ip_address?: string
  user_agent?: string
}

// Uso de API (para controle de custos)
export interface ApiUsage {
  id: string
  user_id: string
  feature: string
  model?: string
  endpoint?: string
  tokens_input: number
  tokens_output: number
  cost_usd: number
  metadata?: Record<string, unknown>
  created_at: string
}

// Log de auditoria
export interface AuditLog {
  id: string
  user_id?: string
  action: string
  target_type?: string
  target_id?: string
  target_user_id?: string
  metadata?: Record<string, unknown>
  ip_address?: string
  user_agent?: string
  created_at: string
}

// Permissões por role
export const rolePermissions: Record<UserRole, string[]> = {
  super_admin: [
    'view_all_users',
    'manage_users',
    'manage_professionals',
    'manage_assignments',
    'view_api_costs',
    'view_audit_logs',
    'manage_settings',
    'view_all_clients',
    'send_feedback',
    'chat',
  ],
  admin: [
    'view_all_users',
    'manage_users',
    'manage_professionals',
    'manage_assignments',
    'view_api_costs',
    'view_audit_logs',
    'view_all_clients',
    'send_feedback',
    'chat',
  ],
  nutritionist: [
    'view_assigned_clients',
    'manage_meal_plans',
    'send_feedback',
    'chat',
  ],
  trainer: [
    'view_assigned_clients',
    'manage_workout_plans',
    'send_feedback',
    'chat',
  ],
  client: [
    'view_own_data',
    'chat',
  ],
}

// Labels para roles
export const roleLabels: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Administrador',
  nutritionist: 'Nutricionista',
  trainer: 'Personal Trainer',
  client: 'Cliente',
}

// Labels para tipos de profissional
export const professionalTypeLabels: Record<ProfessionalType, string> = {
  nutritionist: 'Nutricionista',
  trainer: 'Personal Trainer',
}

// Versão atual dos termos de uso
export const CURRENT_TERMS_VERSION = '1.0'

// Funções auxiliares
export function isAdmin(role: UserRole): boolean {
  return role === 'super_admin' || role === 'admin'
}

export function isProfessional(role: UserRole): boolean {
  return role === 'nutritionist' || role === 'trainer'
}

export function hasPermission(role: UserRole, permission: string): boolean {
  return rolePermissions[role]?.includes(permission) ?? false
}
