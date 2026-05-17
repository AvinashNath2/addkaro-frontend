import api from './axios'
import type { CoreResponse } from '@/types/auth.types'
import type { ChatMessage } from '@/types/index'
import { IS_MOCK, mockFetch } from '@/lib/mockMode'

export async function getChatHistory(offerId: string): Promise<ChatMessage[]> {
  if (IS_MOCK) {
    const msgs = await mockFetch<ChatMessage[]>('chat-messages.json')
    return msgs.filter((m) => m.offerId === offerId || true).slice(0, 4)
  }
  const res = await api.get<CoreResponse<ChatMessage[]>>(`/offers/${offerId}/chat`)
  return res.data.data
}

export async function sendChatMessage(offerId: string, message: string): Promise<ChatMessage> {
  if (IS_MOCK) {
    return {
      messageId: 'msg-' + Date.now(),
      offerId,
      senderId: 'demo-user',
      senderRole: 'CUSTOMER',
      message,
      sentAt: new Date().toISOString(),
      readAt: null,
    }
  }
  const res = await api.post<CoreResponse<ChatMessage>>(`/offers/${offerId}/chat`, { message })
  return res.data.data
}
