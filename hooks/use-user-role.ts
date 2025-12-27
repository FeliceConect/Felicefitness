"use client"

import { useState, useEffect, useCallback } from 'react'
import type { UserRole } from '@/lib/admin/types'
import { isAdmin, isProfessional, hasPermission } from '@/lib/admin/types'

interface UseUserRoleReturn {
  role: UserRole
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
        setUserId(data.user_id || null)
        setEmail(data.email || null)
      } else {
        // Se não autenticado, define como client (padrão)
        setRole('client')
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
