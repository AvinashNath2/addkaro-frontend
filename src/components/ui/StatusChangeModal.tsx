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
      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-sm p-6 lp-modal">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="font-bold text-gray-900 text-base mb-1">Confirm Status Change</h3>
        <p className="text-sm text-gray-400 mb-4">Review what will change before proceeding.</p>

        <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-200 text-gray-600">
            {fromLabel}
          </span>
          <span className="text-gray-400 text-sm flex-1 text-center">→</span>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-900 text-white">
            {toLabel}
          </span>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed mb-5">{impact}</p>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => { onConfirm(); onCancel() }}
            className="flex-1 px-4 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-90"
            style={{ background: '#C9F31D', color: '#111111' }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
