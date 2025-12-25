'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Share2, Loader2 } from 'lucide-react'
import { ShareModal } from './share-modal'
import type { ShareType, ShareCardData } from '@/types/share'

interface ShareButtonProps {
  type: ShareType
  data: ShareCardData
  variant?: 'icon' | 'button' | 'fab'
  className?: string
}

export function ShareButton({ type, data, variant = 'button', className }: ShareButtonProps) {
  const [showModal, setShowModal] = useState(false)

  if (variant === 'icon') {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          className={cn(
            'p-2 rounded-full hover:bg-muted/50 transition-colors',
            className
          )}
        >
          <Share2 className="w-5 h-5" />
        </button>
        <ShareModal
          open={showModal}
          onClose={() => setShowModal(false)}
          type={type}
          data={data}
        />
      </>
    )
  }

  if (variant === 'fab') {
    return (
      <>
        <Button
          size="icon"
          className={cn(
            'fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full shadow-lg bg-purple-600 hover:bg-purple-700',
            className
          )}
          onClick={() => setShowModal(true)}
        >
          <Share2 className="w-6 h-6" />
        </Button>
        <ShareModal
          open={showModal}
          onClose={() => setShowModal(false)}
          type={type}
          data={data}
        />
      </>
    )
  }

  return (
    <>
      <Button
        variant="outline"
        className={cn('border-purple-500/30 hover:bg-purple-500/10', className)}
        onClick={() => setShowModal(true)}
      >
        <Share2 className="w-4 h-4 mr-2" />
        Compartilhar
      </Button>
      <ShareModal
        open={showModal}
        onClose={() => setShowModal(false)}
        type={type}
        data={data}
      />
    </>
  )
}

// Loading button variant
export function ShareButtonLoading({ variant = 'button' }: { variant?: 'icon' | 'button' }) {
  if (variant === 'icon') {
    return (
      <button className="p-2 rounded-full" disabled>
        <Loader2 className="w-5 h-5 animate-spin" />
      </button>
    )
  }

  return (
    <Button variant="outline" disabled>
      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      Compartilhar
    </Button>
  )
}
