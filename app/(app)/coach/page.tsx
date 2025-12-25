'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, History, Sparkles, Menu, Plus } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useCoach } from '@/hooks/use-coach'
import { useCoachSuggestions } from '@/hooks/use-coach-suggestions'
import { CoachChat, CoachDailyBriefing } from '@/components/coach'
import type { CoachAction } from '@/types/coach'

export default function CoachPage() {
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    context,
    conversationId,
    conversations,
    selectConversation,
    newConversation,
    loadConversations,
  } = useCoach()

  const {
    dailyBriefing,
    isLoading: suggestionsLoading,
  } = useCoachSuggestions()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showBriefing, setShowBriefing] = useState(true)

  // Load conversations on mount
  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  const handleSendMessage = (message: string) => {
    setShowBriefing(false)
    sendMessage(message)
  }

  const handleSelectConversation = (id: string) => {
    selectConversation(id)
    setSidebarOpen(false)
    setShowBriefing(false)
  }

  const handleNewConversation = () => {
    newConversation()
    setSidebarOpen(false)
    setShowBriefing(true)
  }

  const handleActionClick = (action: CoachAction) => {
    // Actions are handled by the router navigation in useCoach
    console.log('Action clicked:', action)
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-sm">FeliceCoach</h1>
              <p className="text-[10px] text-muted-foreground">Seu coach pessoal</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Link href="/coach/insights">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Sparkles className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/coach/historico">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <History className="h-4 w-4" />
            </Button>
          </Link>

          {/* Conversations sidebar */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] p-0">
              <SheetHeader className="p-4 border-b">
                <SheetTitle>Conversas</SheetTitle>
              </SheetHeader>
              <div className="p-3">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={handleNewConversation}
                >
                  <Plus className="h-4 w-4" />
                  Nova conversa
                </Button>
              </div>
              <ScrollArea className="h-[calc(100vh-120px)]">
                <div className="p-2 space-y-1">
                  {conversations.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Nenhuma conversa ainda
                    </p>
                  ) : (
                    conversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => handleSelectConversation(conv.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          conversationId === conv.id
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-muted'
                        }`}
                      >
                        <p className="font-medium truncate">{conv.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(conv.updatedAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Daily Briefing - shown when no messages */}
      {showBriefing && messages.length === 0 && dailyBriefing && !suggestionsLoading && (
        <div className="px-4 py-3 border-b bg-gradient-to-r from-violet-500/5 to-purple-500/5">
          <CoachDailyBriefing
            briefing={dailyBriefing}
            compact
            onAskCoach={(question) => handleSendMessage(question)}
          />
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="px-4 py-2 bg-destructive/10 border-b border-destructive/20">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Chat area */}
      <div className="flex-1 overflow-hidden">
        <CoachChat
          messages={messages}
          isLoading={isLoading}
          context={context}
          onSendMessage={handleSendMessage}
          onActionClick={handleActionClick}
        />
      </div>
    </div>
  )
}
