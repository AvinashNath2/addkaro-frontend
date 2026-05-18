import { cn } from '@/lib/utils'

const STATUS_STYLES: Record<string, { pill: string; dot: string }> = {
  // Backend holding statuses
  PENDING:            { pill: 'bg-amber-50    text-amber-700',  dot: 'bg-amber-400' },
  ACTIVE:             { pill: 'bg-emerald-50  text-emerald-700',dot: 'bg-emerald-500' },
  REJECTED:           { pill: 'bg-red-50      text-red-700',    dot: 'bg-red-500' },
  SUSPENDED:          { pill: 'bg-rose-50     text-rose-700',   dot: 'bg-rose-500' },
  // Extended UI workflow statuses
  DRAFT:              { pill: 'bg-gray-100    text-gray-600',   dot: 'bg-gray-400' },
  PENDING_REVIEW:     { pill: 'bg-amber-50    text-amber-700',  dot: 'bg-amber-400' },
  ADMIN_REJECT:       { pill: 'bg-red-50      text-red-700',    dot: 'bg-red-500' },
  PUBLISHED:          { pill: 'bg-emerald-50  text-emerald-700',dot: 'bg-emerald-500' },
  BOOKED:             { pill: 'bg-blue-50     text-blue-700',   dot: 'bg-blue-500' },
  OWNER_PAUSE:        { pill: 'bg-orange-50   text-orange-700', dot: 'bg-orange-400' },
  DELISTED_BY_ADMIN:  { pill: 'bg-rose-50     text-rose-700',   dot: 'bg-rose-500' },
  NEW:                { pill: 'bg-blue-50     text-blue-700',   dot: 'bg-blue-500' },
  CONTACTED:          { pill: 'bg-purple-50   text-purple-700', dot: 'bg-purple-500' },
  NEGOTIATING:        { pill: 'bg-orange-50   text-orange-700', dot: 'bg-orange-400' },
  CLOSED:             { pill: 'bg-emerald-50  text-emerald-700',dot: 'bg-emerald-500' },
  DECLINED:           { pill: 'bg-red-50      text-red-700',    dot: 'bg-red-500' },
}

const FALLBACK = { pill: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' }

interface Props { status: string }

export default function StatusBadge({ status }: Props) {
  if (!status) return null
  const { pill, dot } = STATUS_STYLES[status] ?? FALLBACK
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide', pill)}>
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dot)} />
      {status.replace(/_/g, ' ')}
    </span>
  )
}
