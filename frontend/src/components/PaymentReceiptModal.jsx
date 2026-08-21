import { useState } from "react";
import { Copy, Check, Share2, Printer, MessageCircle } from "lucide-react";
import Modal from "./Modal";
import { formatCurrency, formatDate } from "../utils/format";
import { buildReceiptMessage, buildWhatsAppLink } from "../utils/whatsapp";

export default function PaymentReceiptModal({ customer, payment, paidThroughDate, onClose }) {
  const [copied, setCopied] = useState(false);
  const message = buildReceiptMessage({ customer, payment, paidThroughDate });

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // Clipboard API can fail (permissions/http); fall back silently.
    }
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Payment Receipt", text: message });
      } catch (e) {
        // user cancelled share sheet — no-op
      }
    } else {
      handleCopy();
    }
  }

  function handlePrint() {
    const printWindow = window.open("", "_blank", "width=380,height=600");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head><title>Receipt #${payment.receiptNumber}</title>
        <style>
          body { font-family: 'Courier New', monospace; padding: 24px; white-space: pre-wrap; font-size: 14px; }
        </style>
        </head>
        <body>${message.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  return (
    <Modal title="Payment recorded" onClose={onClose}>
      <div className="flex flex-col gap-5">
        <div className="rounded-xl border border-hairline bg-paper p-4">
          <div className="flex items-center justify-between border-b border-dashed border-hairline pb-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Receipt</span>
            <span className="font-mono text-sm font-semibold text-ink">#{payment.receiptNumber}</span>
          </div>
          <div className="mt-3 space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-ink-soft">Customer</span><span className="font-medium text-ink">{customer.name}</span></div>
            <div className="flex justify-between"><span className="text-ink-soft">Amount</span><span className="font-mono font-semibold text-paid">{formatCurrency(payment.amount)}</span></div>
            <div className="flex justify-between"><span className="text-ink-soft">Mode</span><span className="font-medium text-ink">{payment.paymentMode}</span></div>
            <div className="flex justify-between"><span className="text-ink-soft">Date</span><span className="font-medium text-ink">{formatDate(payment.paymentDate)}</span></div>
            <div className="flex justify-between border-t border-hairline pt-1.5"><span className="text-ink-soft">Paid till</span><span className="font-semibold text-ink">{formatDate(paidThroughDate)}</span></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={handleCopy} className="btn-orbit px-3 py-2.5 text-sm">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button type="button" onClick={handleShare} className="btn-orbit px-3 py-2.5 text-sm">
            <Share2 className="h-4 w-4" />
            Share
          </button>
          {customer.phone && (
            <a
              href={buildWhatsAppLink(customer.phone, message)}
              target="_blank"
              rel="noreferrer"
              className="btn-orbit px-3 py-2.5 text-sm"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
          )}
          <button type="button" onClick={handlePrint} className="btn-orbit px-3 py-2.5 text-sm">
            <Printer className="h-4 w-4" />
            Print
          </button>
        </div>

        <button type="button" onClick={onClose} className="btn-prism py-2.5 text-sm">
          Done
        </button>
      </div>
    </Modal>
  );
}
