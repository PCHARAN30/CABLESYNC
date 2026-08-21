import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowUpRight, ReceiptText, Users, MessageCircle } from "lucide-react";
import TopBar from "../components/TopBar";
import StatusStamp from "../components/StatusStamp";
import api from "../services/api";
import { formatCurrency } from "../utils/format";
import { buildReminderMessage, buildWhatsAppLink } from "../utils/whatsapp";

const RANGES = [
  { value: "any", label: "Any days overdue" },
  { value: "1-7", label: "1 – 7 days" },
  { value: "8-30", label: "8 – 30 days" },
  { value: "31-60", label: "31 – 60 days" },
  { value: "61+", label: "61+ days" },
];

function matchesRange(days, range) {
  if (range === "any") return true;
  if (range === "61+") return days >= 61;
  const [min, max] = range.split("-").map(Number);
  return days >= min && days <= max;
}

export default function PendingDues() {
  const [range, setRange] = useState("any");
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["pendingDues"],
    queryFn: () => api.get("/reports/pending-dues").then((res) => res.data),
  });

  const filteredCustomers = useMemo(() => {
    if (!data?.customers) return [];
    return data.customers.filter((c) => matchesRange(c.daysOverdue ?? 0, range));
  }, [data, range]);

  const filteredTotal = useMemo(
    () => filteredCustomers.reduce((sum, c) => sum + c.arrears, 0),
    [filteredCustomers],
  );

  return (
    <div className="app-page">
      <TopBar title="Pending dues" backTo="/reports" />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:py-8">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><p className="text-sm font-semibold text-brass-dark">Collection report</p><h1 className="font-display text-3xl font-semibold text-ink">Outstanding balances</h1><p className="mt-1 text-sm text-ink-soft">Prioritized by the amount waiting to be collected.</p></div>
          <button onClick={() => refetch()} className="btn-orbit px-4 py-2.5 text-sm" disabled={isFetching}>{isFetching ? "Refreshing…" : "Refresh report"}</button>
        </div>

        {isLoading && <div className="grid gap-4 sm:grid-cols-2"><div className="h-32 animate-pulse rounded-2xl bg-card" /><div className="h-32 animate-pulse rounded-2xl bg-card" /></div>}
        {isError && <div className="rounded-2xl border border-due/20 bg-due-soft p-8 text-center"><AlertTriangle className="mx-auto h-9 w-9 text-due" /><h2 className="mt-3 font-semibold text-ink">Couldn’t load pending dues</h2><p className="mt-1 text-sm text-ink-soft">{error.message}</p><button onClick={() => refetch()} className="btn-prism mt-4 px-4 py-2 text-sm">Try again</button></div>}
        {data && <>
          <section className="mb-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-due/15 bg-card p-5 shadow-ledger"><div className="flex items-center justify-between"><p className="text-sm font-medium text-ink-soft">Total outstanding{range !== "any" ? " (filtered)" : ""}</p><span className="grid h-10 w-10 place-items-center rounded-xl bg-due-soft text-due"><ReceiptText className="h-5 w-5" /></span></div><p className="mt-5 font-display text-4xl font-semibold text-due">{formatCurrency(range === "any" ? data.totalPendingAmount : filteredTotal)}</p><p className="mt-1 text-sm text-ink-soft">Across active subscriptions</p></div>
            <div className="rounded-2xl border border-hairline bg-card p-5 shadow-ledger"><div className="flex items-center justify-between"><p className="text-sm font-medium text-ink-soft">Customers to follow up</p><span className="grid h-10 w-10 place-items-center rounded-xl bg-paper text-brass"><Users className="h-5 w-5" /></span></div><p className="mt-5 font-display text-4xl font-semibold text-ink">{filteredCustomers.length}</p><p className="mt-1 text-sm text-ink-soft">Sorted by highest balance</p></div>
          </section>

          <div className="mb-5 flex flex-wrap gap-2">
            {RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${range === r.value ? "border-brass bg-brass/10 text-brass-dark" : "border-hairline bg-paper text-ink-soft hover:border-brass/40"}`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {filteredCustomers.length === 0 ? <div className="rounded-2xl border border-hairline bg-card px-6 py-16 text-center shadow-ledger"><div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-paid-soft text-paid">✓</div><h2 className="mt-4 font-display text-2xl font-semibold text-ink">All caught up</h2><p className="mt-2 text-sm text-ink-soft">{range === "any" ? "There are no active customers with an outstanding balance." : "No customers fall in this overdue range."}</p></div> : <section className="overflow-hidden rounded-2xl border border-hairline bg-card shadow-ledger"><div className="hidden grid-cols-[1.5fr_1fr_auto_auto_auto] gap-4 border-b border-hairline bg-paper px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-soft md:grid"><span>Customer</span><span>Area</span><span>Overdue</span><span>Balance</span><span /></div><div className="divide-y divide-hairline">{filteredCustomers.map((customer) => <div key={customer._id} className="group grid gap-3 px-5 py-4 transition-colors hover:bg-paper md:grid-cols-[1.5fr_1fr_auto_auto_auto] md:items-center md:gap-4"><Link to={`/customers/${customer._id}`} state={{ openPayment: true }}><p className="font-semibold text-ink">{customer.name}</p><p className="mt-1 text-sm text-ink-soft">{customer.phone}</p></Link><p className="text-sm text-ink-soft">{customer.area || "No area"}</p><span className="text-sm font-medium text-ink-soft">{customer.daysOverdue > 0 ? `${customer.daysOverdue}d overdue` : "—"}</span><div className="flex items-center gap-3"><span className="font-mono text-lg font-semibold text-due">{formatCurrency(customer.arrears)}</span><StatusStamp status={customer.status} /></div><div className="ml-auto flex items-center gap-3">{customer.phone && <a href={buildWhatsAppLink(customer.phone, buildReminderMessage(customer, customer))} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} aria-label="Send WhatsApp reminder" className="text-ink-soft hover:text-paid"><MessageCircle className="h-4 w-4" /></a>}<Link to={`/customers/${customer._id}`} state={{ openPayment: true }} className="inline-flex items-center gap-1 text-sm font-semibold text-brass-dark">Collect <ArrowUpRight className="h-4 w-4" /></Link></div></div>)}</div></section>}
        </>}
      </main>
    </div>
  );
}
