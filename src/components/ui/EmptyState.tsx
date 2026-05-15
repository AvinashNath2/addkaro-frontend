import { SearchX } from 'lucide-react'

interface Props {
  message: string
}

export default function EmptyState({ message }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        <SearchX className="w-6 h-6 text-gray-400" />
      </div>
      <p className="text-sm font-semibold text-gray-400 max-w-xs leading-relaxed">{message}</p>
    </div>
  )
}
