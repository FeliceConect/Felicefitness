"use client"

import React from 'react'

// Detecta URLs (http/https e www.) e e-mails no meio do texto.
// Tokeniza em JSX — nunca usa dangerouslySetInnerHTML, então é seguro
// contra XSS: o texto do usuário entra como children de React, escapado.
const URL_RE = /((?:https?:\/\/|www\.)[^\s<]+[^\s<.,;:!?)\]}'"]|[^\s<]+@[^\s<]+\.[^\s<]+)/gi

function normalizeHref(token: string): string | null {
  if (token.includes('@') && !token.includes('/')) {
    // e-mail
    return `mailto:${token}`
  }
  if (/^https?:\/\//i.test(token)) return token
  if (/^www\./i.test(token)) return `https://${token}`
  return null
}

interface MessageTextProps {
  content: string
  className?: string
  /** cor do link — herda por padrão, com sublinhado */
  linkClassName?: string
}

/**
 * Renderiza o conteúdo de uma mensagem de chat transformando URLs e e-mails
 * em links clicáveis. Usado nas bolhas do paciente e do profissional.
 */
export function MessageText({ content, className, linkClassName }: MessageTextProps) {
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  // regex é global — reseta lastIndex a cada render por segurança
  URL_RE.lastIndex = 0

  let key = 0
  while ((match = URL_RE.exec(content)) !== null) {
    const token = match[0]
    const href = normalizeHref(token)
    if (match.index > lastIndex) {
      parts.push(<span key={key++}>{content.slice(lastIndex, match.index)}</span>)
    }
    if (href) {
      parts.push(
        <a
          key={key++}
          href={href}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className={linkClassName || 'underline break-all hover:opacity-80'}
          onClick={(e) => e.stopPropagation()}
        >
          {token}
        </a>
      )
    } else {
      parts.push(<span key={key++}>{token}</span>)
    }
    lastIndex = match.index + token.length
  }
  if (lastIndex < content.length) {
    parts.push(<span key={key++}>{content.slice(lastIndex)}</span>)
  }

  return <p className={className}>{parts}</p>
}
