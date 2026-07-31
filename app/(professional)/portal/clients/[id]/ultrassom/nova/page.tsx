'use client'

import { useParams } from 'next/navigation'
import { CollectionWizard } from '@/components/portal/ultrassom/collection-wizard'

export default function NovaAvaliacaoUltrassomPage() {
  const params = useParams()
  const patientId = typeof params.id === 'string' ? params.id : ''

  if (!patientId) return null

  return <CollectionWizard patientId={patientId} />
}
