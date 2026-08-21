function DashboardSection({ title, icon: Icon, children }) {
  return (
    <div className="rounded-2xl border border-hairline bg-card p-5 shadow-ledger sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        {Icon && <Icon className="h-6 w-6 text-ink-soft" />}
        <h3 className="font-display text-xl font-semibold text-ink">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default DashboardSection;
