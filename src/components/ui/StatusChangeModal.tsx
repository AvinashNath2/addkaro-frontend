import { X } from 'lucide-react'

const STATUS_LABELS: Record<string, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  NEGOTIATING: 'Negotiating',
  CLOSED: 'Closed',
  DECLINED: 'Declined',
}

const IMPACT_TEXT: Record<string, string> = {
  CONTACTED:
    "The customer's contact number will be revealed. Chat will unlock for both parties. This cannot be undone.",
  NEGOTIATING:
    'This offer will be marked as Under Negotiation. You can update the status or continue chatting.',
  NEGOTIATING_FROM_DECLINED:
    'This declined offer will be reopened for negotiation. Chat will be re-enabled for both parties.',
  CLOSED:
    'This deal will be permanently marked as closed. The status cannot be changed again.',
  DECLINED:
    'This offer will be declined. Chat will be locked — both parties can only view past messages, not send new ones.',
}

interface Props {
  fromStatus: string
  toStatus: string
  onConfirm: () => void
  onCancel: () => void
}

export default function StatusChangeModal({ fromStatus, toStatus, onConfirm, onCancel }: Props) {
  const impactKey =
    fromStatus === 'DECLINED' && toStatus === 'NEGOTIATING'
      ? 'NEGOTIATING_FROM_DECLINED'
      : toStatus
  const impact =
    IMPACT_TEXT[impactKey] ??
    `The status will change from ${STATUS_LABELS[fromStatus] ?? fromStatus} to ${STATUS_LABELS[toStatus] ?? toStatus}.`

  const fromLabel = STATUS_LABELS[fromStatus] ?? fromStatus
  const toLabel = STATUS_LABELS[toStatus] ?? toStatus

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm p-6 lp-modal" style={{ background: '#f5f1eb', border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 24px 80px rgba(0,0,0,0.18)' }}>
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-900 transition-colors"
          style={{ background: 'rgba(0,0,0,0.06)' }}
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="font-black text-gray-900 text-base mb-1" style={{ fontFamily: '"Barlow Condensed", sans-serif', fontSize: 20, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Confirm Status Change</h3>
        <p className="text-sm text-gray-400 mb-4">Review what will change before proceeding.</p>

        <div className="flex items-center gap-3 mb-4 p-3" style={{ background: '#e8e3db', border: '1px solid rgba(0,0,0,0.07)' }}>
          <span className="text-xs font-bold px-2.5 py-1 text-gray-600" style={{ background: '#d8d2c8' }}>
            {fromLabel}
          </span>
          <span className="text-gray-400 text-sm flex-1 text-center">→</span>
          <span className="text-xs font-bold px-2.5 py-1 text-white" style={{ background: '#111111' }}>
            {toLabel}
          </span>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed mb-5">{impact}</p>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-sm font-bold text-gray-700 transition-colors hover:bg-black/5"
            style={{ border: '1px solid rgba(0,0,0,0.12)' }}
          >
            Cancel
          </button>
          <button
            onClick={() => { onConfirm(); onCancel() }}
            className="flex-1 px-4 py-2 text-sm font-bold transition-opacity hover:opacity-90"
            style={{ background: '#1a3560', color: '#ffffff' }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
