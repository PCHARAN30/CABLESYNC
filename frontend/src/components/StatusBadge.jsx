const VARIANTS = {
  PAID: "bg-paid-soft text-paid",
  PARTIAL: "bg-partial-soft text-partial",
  DUE: "bg-due-soft text-due",
  INACTIVE: "bg-hairline text-ink-soft",
};

const LABELS = {
  PAID: "Paid",
  PARTIAL: "Partial",
  DUE: "Due",
  INACTIVE: "Inactive",
};

export default function StatusBadge({ status }) {
  const className = VARIANTS[status] || VARIANTS.INACTIVE;
  const label = LABELS[status] || LABELS.INACTIVE;

  return (
    <div
      className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${className}`}
    >
      {label}
    </div>
  );
}
