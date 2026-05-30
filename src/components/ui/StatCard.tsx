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
      className={`overflow-hidden transition-all ${onClick ? 'cursor-pointer' : ''}`}
      style={{
        background: '#f0ece6',
        border: '1px solid rgba(0,0,0,0.07)',
        transition: 'transform 0.25s cubic-bezier(0.25,0.46,0.45,0.94), box-shadow 0.25s',
      }}
      onMouseEnter={onClick ? (e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.09)' }) : undefined}
      onMouseLeave={onClick ? (e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }) : undefined}
    >
      <div className={`h-[3px] w-full ${accent}`} style={{ opacity: 0.9 }} />
      <div className="px-5 py-4">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-2">{label}</p>
        <p className="text-[28px] font-extrabold text-gray-900 leading-none">{value}</p>
      </div>
    </div>
  )
}
