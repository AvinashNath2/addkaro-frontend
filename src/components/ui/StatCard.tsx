// accent: a Tailwind bg-color class, e.g. "bg-brand-500", "bg-green-500"
interface Props {
  label: string
  value: number | string
  accent?: string
}

export default function StatCard({ label, value, accent = 'bg-brand-500' }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card hover:shadow-card-md transition-shadow overflow-hidden">
      <div className={`h-[3px] w-full ${accent}`} />
      <div className="px-5 py-4">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-2">{label}</p>
        <p className="text-[28px] font-extrabold text-gray-900 leading-none">{value}</p>
      </div>
    </div>
  )
}
