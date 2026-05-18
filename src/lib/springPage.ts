import type { PageResponse } from '@/types/index'

// Converts Spring Data Page JSON (content, number, last/first)
// to the frontend PageResponse shape (items, page, hasNext/hasPrevious).
export function fromSpringPage<T>(page: Record<string, unknown>): PageResponse<T> {
  return {
    items: (page.content as T[]) ?? [],
    page: (page.number as number) ?? 0,
    size: (page.size as number) ?? 0,
    totalElements: (page.totalElements as number) ?? 0,
    totalPages: (page.totalPages as number) ?? 0,
    hasNext: !(page.last as boolean),
    hasPrevious: !(page.first as boolean),
  }
}
