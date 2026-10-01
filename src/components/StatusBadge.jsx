import { STATUS } from '../lib/projects'

const TONES = {
  ok: 'text-ok',
  warn: 'text-warn',
  muted: 'text-muted',
}

export default function StatusBadge({ status }) {
  const { label, tone } = STATUS[status] ?? STATUS.live
  return (
    <span className={`chip border-current/30 bg-ink/80 ${TONES[tone]}`}>
      <span className={`dot ${status === 'live' ? 'dot-live' : ''}`} />
      {label}
    </span>
  )
}
