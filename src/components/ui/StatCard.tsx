interface Props {
  label: string
  value: number | string
  accent?: string
  onClick?: () => void
}

export default function StatCard({ label, value, accent = 'bg-brand-500', onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-gray-100 shadow-card transition-shadow overflow-hidden ${onClick ? 'cursor-pointer hover:shadow-card-md hover:border-gray-200' : 'hover:shadow-card-md'}`}
    >
      <div className={`h-[3px] w-full ${accent}`} />
      <div className="px-5 py-4">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-2">{label}</p>
        <p className="text-[28px] font-extrabold text-gray-900 leading-none">{value}</p>
      </div>
    </div>
  )
}
