import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Wallet, Calendar, AlertTriangle } from "lucide-react";
import api from "../services/api";
import PaymentCard from "./PaymentCard";

const now = new Date();
const currentYear = now.getFullYear();
const YEAR_OPTIONS = [currentYear, currentYear - 1, currentYear - 2];

export default function PaymentHistory({ customerId }) {
  const [year, setYear] = useState(currentYear);

  const {
    data: payments = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["payments", customerId, year],
    queryFn: () => api
      .get(`/payments/customer/${customerId}`, { params: { year } })
      .then((res) => res.data),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-xl font-semibold text-ink">
          Payment History
        </h2>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="rounded-lg border border-hairline bg-paper px-2.5 py-1.5 text-sm font-medium text-ink shadow-sm focus:outline-none focus:ring-2 focus:ring-brass/40"
        >
          {YEAR_OPTIONS.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <p className="text-center text-ink-soft">Loading history...</p>}
      {isError && (
        <div className="text-center text-due">
          <AlertTriangle className="mx-auto h-8 w-8" />
          <p className="mt-2 text-sm font-semibold">{error.message || "Could not load payment history"}</p>
        </div>
      )}

      {!isLoading && !isError && (
        <>
          {payments.length > 0 ? (
            <div className="space-y-3">
              {payments.map((p) => (
                <PaymentCard key={p._id} payment={p} />
              ))}
            </div>
          ) : (
            <div className="py-8 text-center bg-card rounded-lg shadow-ledger">
              <Wallet className="mx-auto h-12 w-12 text-ink-soft/50" />
              <p className="mt-4 font-semibold text-ink-soft">
                No payments found for {year}
              </p>
              <p className="text-sm text-ink-soft/80">
                When you record a payment, it will appear here.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
