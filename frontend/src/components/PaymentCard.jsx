import { useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Calendar,
  Wallet,
  MessageSquare,
  Clock,
} from "lucide-react";
import { formatCurrency, formatDate, formatDateTime, monthName } from "../utils/format";

function PaymentCard({ payment }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const DetailRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-start justify-between text-sm">
      <div className="flex items-center gap-2 text-ink-soft">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>
      <span className="text-right font-medium text-ink">{value}</span>
    </div>
  );

  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-ledger transition-all duration-300">
      {/* Collapsed View */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-4">
          <CheckCircle2 className="h-6 w-6 shrink-0 text-paid" />
          <div>
            <p className="font-semibold text-ink">
              {monthName(payment.paidMonth)} {payment.paidYear}
            </p>
            <p className="text-sm text-ink-soft">
              Collected on {formatDate(payment.paymentDate, "dd MMM")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-mono text-lg font-semibold text-paid">
              {formatCurrency(payment.amount)}
            </p>
            <p className="text-sm text-ink-soft">{payment.paymentMode}</p>
          </div>
          <ChevronDown
            className={`h-5 w-5 shrink-0 text-ink-soft transition-transform duration-300 ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {/* Expanded View */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="space-y-3 border-t border-hairline p-4">
            <DetailRow
              icon={Calendar}
              label="Payment Date"
              value={formatDate(payment.paymentDate, "E, dd MMM yyyy")}
            />
            <DetailRow icon={Wallet} label="Payment Mode" value={payment.paymentMode} />
            <DetailRow icon={Clock} label="Entry Time" value={formatDateTime(payment.createdAt)} />
            {payment.notes && (
              <DetailRow icon={MessageSquare} label="Notes" value={payment.notes} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentCard;