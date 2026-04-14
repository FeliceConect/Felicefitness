"use client"

import { useState, useEffect, useCallback } from 'react'
import type { UserRole } from '@/lib/admin/types'
import { isAdmin, isProfessional, hasPermission } from '@/lib/admin/types'

export type AdminType = 'secretary' | 'support' | null

interface UseUserRoleReturn {
  role: UserRole
  adminType: AdminType
  userId: string | null
  email: string | null
  loading: boolean
  error: string | null
  isAdmin: boolean
  isProfessional: boolean
  isClient: boolean
  hasPermission: (permission: string) => boolean
  refresh: () => Promise<void>
}

export function useUserRole(): UseUserRoleReturn {
  const [role, setRole] = useState<UserRole>('client')
  const [adminType, setAdminType] = useState<AdminType>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRole = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/admin/user-role')
      const data = await response.json()

      if (data.success) {
        setRole(data.role || 'client')
        setAdminType(data.admin_type || null)
        setUserId(data.user_id || null)
        setEmail(data.email || null)
      } else {
        // Se não autenticado, define como client (padrão)
        setRole('client')
        setAdminType(null)
        setUserId(null)
        setEmail(null)
      }
    } catch (err) {
      console.error('Erro ao buscar role:', err)
      setError('Erro ao verificar permissões')
      // Em caso de erro, assume client
      setRole('client')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRole()
  }, [fetchRole])

  const checkPermission = useCallback(
    (permission: string) => hasPermission(role, permission),
    [role]
  )

  return {
    role,
    adminType,
    userId,
    email,
    loading,
    error,
    isAdmin: isAdmin(role),
    isProfessional: isProfessional(role),
    isClient: role === 'client',
    hasPermission: checkPermission,
    refresh: fetchRole,
  }
}
