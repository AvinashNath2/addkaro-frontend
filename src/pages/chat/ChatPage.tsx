import { useState, useEffect, useRef } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Send, Loader2, ArrowLeft, MessageCircle } from 'lucide-react'
import { getChatHistory, sendChatMessage } from '@/api/chat.api'
import { useAuthStore } from '@/store/auth.store'
import { cn } from '@/lib/utils'

const AUTO_MESSAGE = "Hi! I've submitted an offer. Can we connect to discuss further?"

export default function ChatPage() {
  const { offerId } = useParams<{ offerId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()

  const [messageText, setMessageText] = useState('')
  const autoSentRef = useRef(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const sendFirstMessage = (location.state as { sendFirstMessage?: boolean } | null)?.sendFirstMessage

  // Poll every 5 seconds for new messages
  const { data: messages = [], isLoading, isError } = useQuery({
    queryKey: ['chat', offerId],
    queryFn: () => getChatHistory(offerId!),
    enabled: !!offerId,
    refetchInterval: 5000,
  })

  const sendMutation = useMutation({
    mutationFn: (msg: string) => sendChatMessage(offerId!, msg),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', offerId] })
      setMessageText('')
      inputRef.current?.focus()
    },
  })

  // Auto-send greeting when navigating from offer submission and chat is empty
  useEffect(() => {
    if (
      sendFirstMessage &&
      !isLoading &&
      messages.length === 0 &&
      !autoSentRef.current &&
      !sendMutation.isPending
    ) {
      autoSentRef.current = true
      sendMutation.mutate(AUTO_MESSAGE)
    }
  }, [sendFirstMessage, isLoading, messages.length, sendMutation.isPending])

  // Scroll to latest message whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    const text = messageText.trim()
    if (!text || sendMutation.isPending) return
    sendMutation.mutate(text)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-center py-24">
        <p className="text-gray-500 mb-4">Unable to load chat.</p>
        <button onClick={() => navigate(-1)} className="text-brand-600 text-sm hover:underline">
          Go back
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 6rem)' }}>

      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-200 mb-4 shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
          <MessageCircle className="w-5 h-5 text-brand-600" />
        </div>
        <div>
          <h2 className="font-semibold text-gray-900 leading-tight">Chat</h2>
          <p className="text-xs text-gray-400">Offer #{offerId?.slice(-8).toUpperCase()}</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-xs text-gray-400">
          <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
          Live · updates every 5s
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 px-1 pb-2">
        {messages.length === 0 && !sendMutation.isPending && (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 text-sm font-medium">No messages yet</p>
            <p className="text-gray-400 text-xs mt-1">Start the conversation with the owner</p>
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.senderId === user?.userId
          return (
            <div key={msg.messageId} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
              {!isMe && (
                <div className="w-7 h-7 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold text-white shrink-0 mr-2 mt-1">
                  {msg.senderRole === 'OWNER' ? 'O' : 'C'}
                </div>
              )}
              <div
                className={cn(
                  'max-w-[72%] rounded-2xl px-4 py-2.5',
                  isMe
                    ? 'rounded-br-sm'
                    : 'bg-gray-100 text-gray-900 rounded-bl-sm',
                )}
                style={isMe ? { background: '#C9F31D', color: '#111111' } : undefined}
              >
                <p className="text-sm leading-relaxed">{msg.message}</p>
                <p className={cn('text-xs mt-1', isMe ? 'opacity-60' : 'text-gray-400')}>
                  {new Date(msg.sentAt).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {isMe && msg.readAt && (
                    <span> · Read</span>
                  )}
                </p>
              </div>
            </div>
          )
        })}

        {/* Optimistic "sending" bubble */}
        {sendMutation.isPending && (
          <div className="flex justify-end">
            <div className="max-w-[72%] rounded-2xl rounded-br-sm px-4 py-2.5 opacity-70" style={{ background: '#C9F31D', color: '#111111' }}>
              <p className="text-sm">{messageText || AUTO_MESSAGE}</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Send form */}
      <form
        onSubmit={handleSend}
        className="flex gap-2 pt-3 border-t border-gray-200 mt-2 shrink-0"
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
        />
        <button
          type="submit"
          disabled={!messageText.trim() || sendMutation.isPending}
          className="w-11 h-11 rounded-xl flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          style={{ background: '#C9F31D', color: '#111111' }}
        >
          {sendMutation.isPending
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Send className="w-4 h-4" />
          }
        </button>
      </form>
    </div>
  )
}
