// The one signature visual element of the app: a status badge styled
// like a rubber ink stamp, tilted slightly, used everywhere a PAID/
// PARTIAL/DUE status appears (dashboard, list, details).
const VARIANTS = {
  PAID: { className: 'paid', label: 'Paid' },
  PARTIAL: { className: 'partial', label: 'Partial' },
  DUE: { className: 'due', label: 'Due' },
};

export default function StatusStamp({ status }) {
  const normalizedStatus = String(status || 'DUE').toUpperCase();
  const variant = VARIANTS[normalizedStatus] || VARIANTS.DUE;

  return <span className={`payment-stamp ${variant.className}`}>{variant.label}</span>;
}
