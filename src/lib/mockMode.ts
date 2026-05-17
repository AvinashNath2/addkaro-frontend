export const IS_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export async function mockFetch<T>(path: string): Promise<T> {
  const res = await fetch(import.meta.env.BASE_URL + 'mock/' + path)
  if (!res.ok) throw new Error(`Mock fetch failed: ${path}`)
  return res.json()
}

export function mockPage<T>(items: T[]): import('@/types/index').PageResponse<T> {
  return {
    items,
    page: 0,
    size: items.length,
    totalElements: items.length,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false,
  }
}
