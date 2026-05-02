/**
 * Klivora Badge Component
 */
export default function Badge({ children, variant = 'neutral', style = {} }) {
  return (
    <span className={`badge badge-${variant}`} style={style}>
      {children}
    </span>
  );
}

/**
 * Invoice Status Badge
 */
export function StatusBadge({ status }) {
  const map = {
    draft:     { label: 'Draft',     variant: 'neutral' },
    sent:      { label: 'Sent',      variant: 'primary' },
    viewed:    { label: 'Viewed',    variant: 'primary' },
    paid:      { label: 'Paid',      variant: 'success' },
    overdue:   { label: 'Overdue',   variant: 'danger' },
    cancelled: { label: 'Cancelled', variant: 'neutral' },
    // payroll
    approved:  { label: 'Approved',  variant: 'primary' },
    // account types
    asset:     { label: 'Asset',     variant: 'primary' },
    liability: { label: 'Liability', variant: 'danger' },
    equity:    { label: 'Equity',    variant: 'warning' },
    income:    { label: 'Income',    variant: 'success' },
    expense:   { label: 'Expense',   variant: 'neutral' },
  };
  const cfg = map[status] || { label: status, variant: 'neutral' };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}
