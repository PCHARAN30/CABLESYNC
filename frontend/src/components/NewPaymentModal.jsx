import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../services/api";
import Modal from "./Modal";
import { formatCurrency, formatDate } from "../utils/format";
import { Banknote, CalendarDays, Smartphone } from "lucide-react";

function getTodayInputValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function NewPaymentModal({ customer, dueInfo, onClose, onSaved }) {
  const [amount, setAmount] = useState(
    String(dueInfo?.arrears > 0 ? dueInfo.arrears : customer.monthlyFee),
  );
  const [paymentDate, setPaymentDate] = useState(getTodayInputValue);
  const [mode, setMode] = useState("Cash");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const {
    data: preview,
    isLoading: isLoadingPreview,
  } = useQuery({
    queryKey: ["paymentPreview", customer._id, amount, paymentDate],
    queryFn: () =>
      api
        .post("/payments/preview", {
          customerId: customer._id,
          amount: Number(amount),
          paymentDate,
        })
        .then((res) => res.data),
    staleTime: 0,
    gcTime: 0,
    enabled:
      !!customer &&
      !!paymentDate &&
      !!amount &&
      Number(amount) > 0,
  });

  async function handleSave(e) {
    e.preventDefault();
    setError("");

    if (!paymentDate) {
      setError("Please select the payment date.");
      return;
    }

    setSaving(true);
    try {
      const res = await api.post("/payments", {
        customerId: customer._id,
        amount: Number(amount),
        paymentDate,
        paymentMode: mode,
        notes,
      });
      onSaved(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Could not save payment.");
      setSaving(false);
    }
  }

  const currentDue = dueInfo?.arrears || 0;
  const collectingAmount = Number(amount) || 0;
  const remainingDue = preview
    ? preview.arrears
    : Math.max(0, currentDue - collectingAmount);

  const InfoRow = ({ label, value, className = "text-ink" }) => (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-ink-soft">{label}</span>
      <span className={`text-right font-semibold ${className}`}>{value}</span>
    </div>
  );

  return (
    <Modal title="Record payment" onClose={onClose}>
      <form onSubmit={handleSave} className="flex flex-col gap-5">
        <div className="rounded-xl bg-paper p-3">
          <p className="font-semibold text-ink">{customer.name}</p>
          <p className="mt-0.5 text-sm text-ink-soft">
            Outstanding balance:{" "}
            <span className="font-mono font-semibold text-due">
              {formatCurrency(currentDue)}
            </span>
          </p>
        </div>

        {/* Payment date */}
        <div>
          <label
            htmlFor="paymentDate"
            className="text-xs uppercase tracking-wide text-ink-soft"
          >
            Payment date
          </label>
          <div className="relative mt-1">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <input
              id="paymentDate"
              type="date"
              value={paymentDate}
              max={getTodayInputValue()}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full rounded-lg border border-hairline bg-paper py-3 pl-10 pr-3 font-medium text-ink focus:border-brass focus:outline-none focus:ring-2 focus:ring-brass/40"
            />
          </div>
          <p className="mt-1 text-xs text-ink-soft">
            The selected date is the start point for any new 30-day coverage.
            Old dues are settled first.
          </p>
        </div>

        {/* Amount */}
        <div>
          <label
            htmlFor="amount"
            className="text-xs uppercase tracking-wide text-ink-soft"
          >
            Amount
          </label>
          <input
            id="amount"
            type="number"
            min="1"
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 w-full rounded-lg border border-hairline bg-paper p-3 text-2xl font-semibold text-ink focus:border-brass focus:outline-none focus:ring-2 focus:ring-brass/40"
            autoFocus
          />
          <div className="mt-2 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() =>
                setAmount(String(currentDue || customer.monthlyFee))
              }
              className="btn-quiet px-2 py-2 text-xs"
            >
              Full {formatCurrency(currentDue || customer.monthlyFee)}
            </button>
            <button
              type="button"
              onClick={() => setAmount("500")}
              className="btn-orbit px-2 py-2 text-xs"
            >
              ₹500
            </button>
            <button
              type="button"
              onClick={() => setAmount("1000")}
              className="btn-orbit px-2 py-2 text-xs"
            >
              ₹1,000
            </button>
          </div>
        </div>

        {/* Live billing preview */}
        <div className="space-y-2 rounded-lg bg-paper p-3">
          <InfoRow label="Current Due" value={formatCurrency(currentDue)} />
          <InfoRow
            label="Collecting"
            value={formatCurrency(collectingAmount)}
            className="text-paid"
          />
          <div className="border-t border-hairline" />
          <InfoRow
            label="Remaining Due"
            value={formatCurrency(Math.max(0, remainingDue))}
            className={remainingDue > 0 ? "font-bold text-due" : "text-paid"}
          />

          {preview && (
            <>
              <div className="my-2 border-t border-hairline" />
              <InfoRow
                label="Coverage From"
                value={formatDate(preview.paymentDate)}
              />
              <InfoRow
                label="Paid Till"
                value={formatDate(preview.paidThroughDate, "dd MMM yyyy")}
              />
              <InfoRow
                label="Next Due"
                value={formatDate(preview.nextDueDate, "dd MMM yyyy")}
              />
            </>
          )}

          {isLoadingPreview && (
            <p className="text-center text-xs text-ink-soft">Calculating...</p>
          )}
        </div>

        {/* Payment method */}
        <div>
          <p className="text-xs uppercase tracking-wide text-ink-soft">
            Payment method
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {[
              { value: "Cash", icon: Banknote },
              { value: "UPI", icon: Smartphone },
            ].map(({ value, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-xs font-semibold transition-colors ${
                  mode === value
                    ? "border-brass bg-brass/10 text-brass-dark"
                    : "border-hairline bg-paper text-ink-soft hover:border-brass/40"
                }`}
              >
                <Icon className="h-4 w-4" />
                {value}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label
            htmlFor="notes"
            className="text-xs uppercase tracking-wide text-ink-soft"
          >
            Notes (optional)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full resize-none rounded-lg border border-hairline bg-paper p-2.5 text-ink focus:border-brass focus:outline-none focus:ring-2 focus:ring-brass/40"
          />
        </div>

        {error && <p className="text-sm text-due">{error}</p>}

        <button
          type="submit"
          disabled={
            saving ||
            isLoadingPreview ||
            !amount ||
            Number(amount) <= 0 ||
            !paymentDate
          }
          className="btn-prism mt-2 py-3 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving
            ? "Saving..."
            : `Collect ${formatCurrency(collectingAmount)}`}
        </button>
      </form>
    </Modal>
  );
}
