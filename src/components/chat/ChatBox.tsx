// ChatBox.tsx — slide-in chat panel anchored to the right side of the screen.
// Used in both the Customer portal (My Offers) and Owner portal (Holding sub-view).
// Takes an offerId and renders a fully functional chat thread in a fixed overlay.

import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Send, Loader2, X, MessageCircle } from 'lucide-react'
import { getChatHistory, sendChatMessage } from '@/api/chat.api'
import { useAuthStore } from '@/store/auth.store'
import { cn } from '@/lib/utils'

interface ChatBoxProps {
  offerId: string
  offerLabel?: string   // e.g. "Chat with Owner" or customer name shown in header
  onClose: () => void
}

export default function ChatBox({ offerId, offerLabel, onClose }: ChatBoxProps) {
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  const [messageText, setMessageText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Poll every 5 s for new messages while the box is open
  const { data: messages = [], isLoading, isError } = useQuery({
    queryKey: ['chat', offerId],
    queryFn: () => getChatHistory(offerId),
    refetchInterval: 5000,
  })

  const sendMutation = useMutation({
    mutationFn: (msg: string) => sendChatMessage(offerId, msg),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', offerId] })
      setMessageText('')
      inputRef.current?.focus()
    },
  })

  // Scroll to newest message on open and on each new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    const text = messageText.trim()
    if (!text || sendMutation.isPending) return
    sendMutation.mutate(text)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Chat panel */}
      <div className="fixed right-0 top-0 h-full z-50 w-full sm:w-[420px] flex flex-col bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-200 bg-white shrink-0">
          <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
            <MessageCircle className="w-5 h-5 text-brand-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">
              {offerLabel ?? 'Chat'}
            </p>
            <p className="text-xs text-gray-400">
              Offer #{offerId.slice(-8).toUpperCase()} · updates every 5s
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
            </div>
          )}

          {isError && (
            <div className="text-center py-12 text-sm text-red-600">
              Failed to load messages. Please try again.
            </div>
          )}

          {!isLoading && !isError && messages.length === 0 && !sendMutation.isPending && (
            <div className="flex flex-col items-center justify-center h-full py-16 text-center">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <MessageCircle className="w-7 h-7 text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-500">No messages yet</p>
              <p className="text-xs text-gray-400 mt-1">Start the conversation below</p>
            </div>
          )}

          {messages.map((msg) => {
            const isMe = msg.senderId === user?.userId
            return (
              <div key={msg.messageId} className={cn('flex items-end gap-2', isMe ? 'justify-end' : 'justify-start')}>
                {!isMe && (
                  <div className="w-7 h-7 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {msg.senderRole === 'OWNER' ? 'O' : 'C'}
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                    isMe
                      ? 'bg-brand-600 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-900 rounded-bl-sm',
                  )}
                >
                  <p>{msg.message}</p>
                  <p className={cn('text-xs mt-1', isMe ? 'text-brand-200' : 'text-gray-400')}>
                    {new Date(msg.sentAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    {isMe && msg.readAt && ' · Read'}
                  </p>
                </div>
              </div>
            )
          })}

          {/* Optimistic sending bubble */}
          {sendMutation.isPending && (
            <div className="flex justify-end">
              <div className="max-w-[75%] rounded-2xl rounded-br-sm px-3.5 py-2.5 bg-brand-400 text-white text-sm opacity-70">
                {messageText}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Send form */}
        <form
          onSubmit={handleSend}
          className="flex gap-2 px-4 py-3 border-t border-gray-200 bg-white shrink-0"
        >
          <input
            ref={inputRef}
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type a message…"
            className="flex-1 input-field"
            disabled={sendMutation.isPending}
            autoComplete="off"
            autoFocus
          />
          <button
            type="submit"
            disabled={!messageText.trim() || sendMutation.isPending}
            className="w-11 h-11 rounded-xl bg-brand-600 text-white flex items-center justify-center hover:bg-brand-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            {sendMutation.isPending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Send className="w-4 h-4" />
            }
          </button>
        </form>
      </div>
    </>
  )
}
