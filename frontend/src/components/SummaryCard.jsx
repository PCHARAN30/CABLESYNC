export default function SummaryCard({ label, value, tone = 'default', onClick }) {
  const toneStyles = {
    default: {
      container: 'bg-card border border-hairline border-l-4 border-l-ink/20',
      label: 'text-ink-soft',
      value: 'text-ink',
    },
    paid: {
      container: 'bg-paid-soft border border-emerald-100 border-l-4 border-l-paid',
      label: 'text-paid/70',
      value: 'text-paid',
    },
    due: {
      container: 'bg-due-soft border border-red-100 border-l-4 border-l-due',
      label: 'text-due/70',
      value: 'text-due',
    },
    brass: {
      container: 'bg-amber-50 border border-amber-100 border-l-4 border-l-brass',
      label: 'text-brass/70',
      value: 'text-brass-dark',
    },
  };

  const styles = toneStyles[tone];
  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      onClick={onClick}
      className={`${styles.container} rounded-xl px-4 py-3 text-left shadow-ledger ${
        onClick ? 'hover:border-ink-soft transition-colors cursor-pointer' : ''
      }`}
    >
      <p className={`text-xs uppercase tracking-wide mb-1 ${styles.label}`}>{label}</p>
      <p className={`font-mono text-3xl sm:text-2xl tabular ${styles.value}`}>{value}</p>
    </Wrapper>
  );
}
