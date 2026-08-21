import { formatCurrency, formatDate } from "./format";

// Builds a wa.me deep link. Assumes 10-digit Indian mobile numbers (as
// used throughout this app's demo data) and prefixes the +91 country code
// unless the number already looks like it has a country code on it.
export function buildWhatsAppLink(phone, message) {
  const digits = String(phone || "").replace(/\D/g, "");
  const withCountryCode = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${withCountryCode}?text=${encodeURIComponent(message)}`;
}

export function buildReminderMessage(customer, dueInfo) {
  const amount = formatCurrency(dueInfo.arrears);
  const nextDue = formatDate(dueInfo.nextDueDate, "dd MMM yyyy");
  return (
    `Hi ${customer.name}, this is a reminder from CableSync that your ` +
    `cable/internet payment of ${amount} is due (was due ${nextDue}). ` +
    `Please make the payment at your earliest convenience to avoid ` +
    `service interruption. Thank you!`
  );
}

export function buildReceiptMessage({ customer, payment, paidThroughDate }) {
  return (
    `CableSync Payment Receipt\n` +
    `--------------------------------\n` +
    `Receipt #: ${payment.receiptNumber}\n` +
    `Customer: ${customer.name}\n` +
    `Amount: ${formatCurrency(payment.amount)}\n` +
    `Mode: ${payment.paymentMode}\n` +
    `Date: ${formatDate(payment.paymentDate, "dd MMM yyyy")}\n` +
    `Paid till: ${formatDate(paidThroughDate, "dd MMM yyyy")}\n` +
    `--------------------------------\n` +
    `Thank you for your payment!`
  );
}
