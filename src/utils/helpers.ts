export const peso = (amount: number) => `₱${(amount || 0).toFixed(2)}`;
export const fmtDateTime = (date: string) => date ? new Date(date).toLocaleString() : '';
export const fmtDate = (date: string) => date ? new Date(date).toLocaleDateString() : '';
export const getDeadlineInfo = (_dueDate?: string, _status?: string) => {
  return { label: 'Unknown', type: 'info', style: {} };
};
export const getStatusPill = (status: string) => {
  return { label: status, class: 'bg-gray-100 text-gray-800' };
};
