export function genId(prefix: string) {
  return prefix + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

export function peso(n: number | string | null | undefined) {
  const v = Number(n) || 0
  return "₱" + v.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—"
  const d = new Date(iso)
  return d.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })
}

export function fmtDateTime(iso: string | null | undefined) {
  if (!iso) return "—"
  const d = new Date(iso)
  return d.toLocaleString("en-PH", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
}

export function daysLeft(deadline: string | null | undefined): number | null {
  if (!deadline) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dl = new Date(deadline)
  dl.setHours(0, 0, 0, 0)
  return Math.round((dl.getTime() - today.getTime()) / 86400000)
}

export function getDeadlineInfo(deadline: string | null | undefined) {
  if (!deadline) return { label: 'No deadline set', class: 'ok', style: { color: 'var(--text-muted)' } }
  
  const d = daysLeft(deadline)
  if (d === null) return { label: 'No deadline set', class: 'ok', style: { color: 'var(--text-muted)' } }
  
  if (d < 0) return { label: `Overdue by ${Math.abs(d)} day${Math.abs(d) === 1 ? '' : 's'}`, class: 'overdue', style: { color: 'var(--danger)', fontWeight: 600 } }
  if (d === 0) return { label: 'Due today', class: 'overdue', style: { color: 'var(--warning)', fontWeight: 600 } }
  if (d <= 7) return { label: `${d} day${d === 1 ? '' : 's'} left`, class: 'soon', style: { color: 'var(--warning)' } }
  return { label: `${d} days left`, class: 'ok', style: { color: 'var(--success)' } }
}

export function getStatusPill(status: 'paid' | 'partial' | 'unpaid' | string) {
  const map: Record<string, { label: string, color: string, bg: string }> = {
    paid: { label: 'Paid', color: 'var(--success)', bg: 'rgba(16, 185, 129, 0.1)' },
    partial: { label: 'Partial', color: 'var(--warning)', bg: 'rgba(245, 158, 11, 0.1)' },
    unpaid: { label: 'Unpaid', color: 'var(--danger)', bg: 'rgba(239, 68, 68, 0.1)' }
  }
  return map[status] || { label: '—', color: 'var(--text-secondary)', bg: 'rgba(255, 255, 255, 0.1)' }
}
