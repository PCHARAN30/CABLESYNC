import { Link } from "react-router-dom";
import { Phone, Home, FileText, IndianRupee, CalendarCheck2, Clock, AlertCircle } from "lucide-react";
import StatusStamp from "./StatusStamp";
import { formatCurrency, formatDate } from "../utils/format";

const Highlight = ({ text, highlight }) => {
  if (!highlight) return text;
  const parts = text.split(new RegExp(`(${highlight})`, "gi"));
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <strong key={i} className="font-bold text-brass-dark">
            {part}
          </strong>
        ) : (
          part
        ),
      )}
    </span>
  );
};

// "3 days left" / "12 days overdue" chip — makes the list scannable without
// opening every customer. Uses daysRemaining/daysOverdue from the billing
// engine (backend/utils/billing.js) rather than recomputing dates here.
function DaysChip({ customer }) {
  const status = customer.status;
  if (status === "PAID") {
    const days = customer.daysRemaining ?? 0;
    if (days <= 0) return null;
    const soon = days <= 5;
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${soon ? "bg-partial-soft text-partial" : "bg-paid-soft text-paid"}`}>
        <Clock className="h-3 w-3" />
        {days} day{days === 1 ? "" : "s"} left
      </span>
    );
  }
  if (status === "DUE" || status === "PARTIAL") {
    const days = customer.daysOverdue ?? 0;
    if (days <= 0) return null;
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-due-soft px-2 py-0.5 text-xs font-semibold text-due">
        <AlertCircle className="h-3 w-3" />
        {days} day{days === 1 ? "" : "s"} overdue
      </span>
    );
  }
  return null;
}

export default function CustomerCard({ customer, highlight }) {
  const InfoItem = ({ icon: Icon, text }) =>
    text ? (
      <div className="flex items-center gap-2 text-sm text-ink-soft">
        <Icon className="h-4 w-4 shrink-0" />
        <span className="truncate"><Highlight text={text} highlight={highlight} /></span>
      </div>
    ) : null;

  return (
    <Link
      to={`/customers/${customer._id}`}
      className="group block rounded-2xl border border-hairline bg-card p-5 shadow-ledger transition-all duration-200 ease-in-out hover:-translate-y-1 hover:border-brass/40 hover:shadow-xl"
    >
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
        <h3 className="font-display text-xl font-semibold text-ink group-hover:text-brass-dark">
          <Highlight text={customer.name} highlight={highlight} />
        </h3>
        <div className="flex items-center gap-2">
          <DaysChip customer={customer} />
          <StatusStamp status={customer.status} />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
        <InfoItem icon={Phone} text={customer.phone} />
        <InfoItem icon={Home} text={customer.area} />
        <InfoItem icon={FileText} text={`CAF: ${customer.cafNumber || "N/A"}`} />
        <InfoItem
          icon={IndianRupee}
          text={`${formatCurrency(customer.monthlyFee)} / month`}
        />
        {customer.paidThroughDate && (
          <div className="col-span-1 flex items-center gap-2 text-sm font-medium text-ink-soft sm:col-span-2">
            <CalendarCheck2 className="h-4 w-4 shrink-0 text-paid" />
            <span className="truncate">
              Paid till{" "}
              <span className="font-semibold text-ink">
                {formatDate(customer.paidThroughDate, "dd MMM yyyy")}
              </span>
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
