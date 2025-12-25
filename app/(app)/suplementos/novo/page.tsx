'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupplements } from '@/hooks/use-supplements'
import { AppHeader } from '@/components/layout/app-header'
import { SupplementForm } from '@/components/supplements'
import type { NewSupplement } from '@/types/supplements'

export default function NovoSupplementoPage() {
  const router = useRouter()
  const { addSupplement } = useSupplements()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (data: NewSupplement) => {
    try {
      setIsLoading(true)
      await addSupplement(data)
      router.push('/suplementos')
    } catch (error) {
      console.error('Error adding supplement:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Novo Suplemento" showBack />

      <main className="container max-w-lg mx-auto px-4 py-6 pb-8">
        <SupplementForm
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          isLoading={isLoading}
        />
      </main>
    </div>
  )
}
