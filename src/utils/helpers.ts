export const peso = (amount: number) => `₱${(amount || 0).toFixed(2)}`;
export const fmtDateTime = (date: string) => date ? new Date(date).toLocaleString() : '';
export const fmtDate = (date: string) => date ? new Date(date).toLocaleDateString() : '';
export const getDeadlineInfo = (dueDate?: string, _status?: string) => {
  if (!dueDate) {
    return { label: 'No deadline', type: 'info', style: { color: '#868E96' } };
  }
  const due = new Date(dueDate);
  const now = new Date();
  // Compare dates only (strip time)
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffMs = dueDay.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  const label = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  if (diffDays < 0) {
    return { label, type: 'overdue', style: { color: '#E03131', background: '#FFF5F5', padding: '2px 6px', borderRadius: '4px' } };
  } else if (diffDays <= 7) {
    return { label, type: 'soon', style: { color: '#E67700', background: '#FFF9DB', padding: '2px 6px', borderRadius: '4px' } };
  } else {
    return { label, type: 'ok', style: { color: '#2F9E44', background: '#EBFBEE', padding: '2px 6px', borderRadius: '4px' } };
  }
};
export const getStatusPill = (status: string) => {
  return { label: status, class: 'bg-gray-100 text-gray-800' };
};
