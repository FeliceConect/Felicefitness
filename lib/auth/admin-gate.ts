/**
 * Travas de servidor por tipo de admin.
 *
 * O gestor (admin_type 'manager') opera gamificação, agenda e cadastro, mas
 * NUNCA dados de paciente: prontuário, bioimpedância, fotos, formulários,
 * notas e o dashboard clínico. A trava vale no servidor — esconder item de
 * menu não é controle de acesso.
 */
export interface AdminGateProfile {
  role?: string | null
  admin_type?: string | null
}

export function isManagerAdmin(profile: AdminGateProfile | null | undefined): boolean {
  return profile?.role === 'admin' && profile?.admin_type === 'manager'
}
