import api from './axios'
import type { CoreResponse } from '@/types/auth.types'
import type { ChatMessage } from '@/types/index'

export async function getChatHistory(offerId: string): Promise<ChatMessage[]> {
  const res = await api.get<CoreResponse<ChatMessage[]>>(`/offers/${offerId}/chat`)
  return res.data.data
}

export async function sendChatMessage(offerId: string, message: string): Promise<ChatMessage> {
  const res = await api.post<CoreResponse<ChatMessage>>(`/offers/${offerId}/chat`, { message })
  return res.data.data
}
