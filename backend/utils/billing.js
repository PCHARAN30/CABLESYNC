const { startOfDay } = require("./date");

// Central billing ledger.
//
// Rules:
// 1. A monthly plan is exactly 30 days.
// 2. Old unpaid periods are settled first (FIFO). This prevents a customer
//    who has been due since February from accidentally getting August ->
//    September validity while February -> August dues are ignored.
// 3. When there is no old balance, a payment made today starts a fresh
//    30-day period from the PAYMENT DATE, not from the connection date.
// 4. Advance payments extend the existing paid-through date.
// 5. Partial payments reduce the outstanding rupee balance and are carried
//    forward until the current 30-day period is fully paid.
//
// Example:
//   Connection: 01-Feb
//   First payment: 21-Aug, ₹370
//   Old due is calculated first. ₹370 settles one old 30-day cycle.
//
//   New customer / no old due:
//   Payment: 21-Aug, ₹370 -> Paid till 19-Sep (30 days inclusive).

const DAY_MS = 24 * 60 * 60 * 1000;
const CYCLE_DAYS = 30;

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function daysBetween(a, b) {
  return Math.round((startOfDay(b) - startOfDay(a)) / DAY_MS);
}

function cyclesBetweenInclusive(fromDate, toDate) {
  const days = daysBetween(fromDate, toDate);
  if (days < 0) return 0;
  return Math.ceil((days + 1) / CYCLE_DAYS);
}

function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Replays the payment ledger in payment-date order.
 *
 * createdAt       Customer connection/signup date.
 * monthlyFee      Amount for one 30-day cycle.
 * payments        Full, non-deleted payment history.
 * now             Date used for the live due calculation.
 */
function computeBilling({ createdAt, monthlyFee, payments = [], now = new Date() }) {
  const created = startOfDay(createdAt || now);
  const today = startOfDay(now);
  const fee = Math.max(0, safeNumber(monthlyFee));

  const orderedPayments = [...payments]
    .filter((p) => safeNumber(p?.amount) > 0 && p?.paymentDate)
    .map((p) => ({
      ...p,
      amount: safeNumber(p.amount),
      paymentDate: startOfDay(p.paymentDate),
    }))
    .sort((a, b) => a.paymentDate - b.paymentDate);

  // Ledger state.
  // billingCursor = first day not yet billed.
  // paidThrough = last day for which a complete 30-day cycle is paid.
  // cyclePaid = rupees already paid toward the next unpaid cycle.
  // credit = advance money after all currently billed cycles are settled.
  let billingCursor = created;
  let paidThrough = addDays(created, -1);
  let cyclePaid = 0;
  let outstandingCycles = 0;
  let credit = 0;
  let totalPaid = 0;

  function accrueUntil(targetDate) {
    if (fee <= 0 || targetDate < billingCursor) return;

    const cycles = cyclesBetweenInclusive(billingCursor, targetDate);
    if (cycles <= 0) return;

    outstandingCycles += cycles;
    billingCursor = addDays(billingCursor, cycles * CYCLE_DAYS);
  }

  function applyMoney(amount) {
    let remaining = amount;

    // FIFO: finish the oldest unpaid cycle first.
    if (outstandingCycles > 0 && fee > 0) {
      const availableForCycles = cyclePaid + remaining;
      const cyclesSettled = Math.min(
        outstandingCycles,
        Math.floor(availableForCycles / fee),
      );

      if (cyclesSettled > 0) {
        const moneyUsed = cyclesSettled * fee - cyclePaid;
        remaining -= Math.max(0, moneyUsed);
        outstandingCycles -= cyclesSettled;
        cyclePaid = 0;
        paidThrough = addDays(
          paidThrough,
          cyclesSettled * CYCLE_DAYS,
        );
      }

      // Whatever remains below one full cycle stays against the next unpaid
      // cycle; it is not lost and does not create a future paid period yet.
      if (remaining > 0 && outstandingCycles > 0) {
        cyclePaid += remaining;
        remaining = 0;
      }
    }

    // No old debt remains: leftover money is advance credit. The next full
    // cycle starts from the next billing day (or payment day when there is
    // genuinely no existing billed period).
    if (remaining > 0) credit += remaining;

    // If all currently billed cycles are paid, advance credit can purchase
    // future cycles. This is the path that makes "pay today -> 30 days"
    // dynamic instead of tied to the connection date.
    if (outstandingCycles === 0 && cyclePaid === 0 && fee > 0 && credit >= fee) {
      const cyclesBought = Math.floor(credit / fee);
      const advanceStart = billingCursor;

      paidThrough = addDays(
        advanceStart,
        cyclesBought * CYCLE_DAYS - 1,
      );
      billingCursor = addDays(paidThrough, 1);
      credit -= cyclesBought * fee;
    }
  }

  for (const payment of orderedPayments) {
    totalPaid += payment.amount;
    accrueUntil(payment.paymentDate);
    applyMoney(payment.amount);
  }

  // Live billing up to today. This adds new due cycles without pretending
  // they were paid. The paid-through date remains historical.
  accrueUntil(today);

  // If there is partial money against the current unpaid cycle, it reduces
  // the amount required to settle that cycle.
  const liveArrears = Math.max(
    0,
    outstandingCycles * fee - cyclePaid,
  );

  // If there are no outstanding cycles, credit is already represented by the
  // future paid-through date. It should not also be reported as an arrears.
  const arrears = outstandingCycles > 0 ? liveArrears : 0;
  const nextDueDate = outstandingCycles > 0 ? paidThrough : billingCursor;
  const daysRemaining = Math.max(0, daysBetween(today, billingCursor));
  const daysOverdue = arrears > 0
    ? Math.max(0, daysBetween(nextDueDate, addDays(today, -1)))
    : 0;

  let status = "PAID";
  if (arrears <= 0) {
    status = "PAID";
  } else if (arrears < fee) {
    status = "PARTIAL";
  } else {
    status = "DUE";
  }

  const monthsAdvance = Math.max(
    0,
    Math.floor(Math.max(0, daysRemaining - 1) / CYCLE_DAYS),
  );

  return {
    status,
    paidThroughDate: paidThrough,
    nextDueDate: arrears > 0 ? addDays(paidThrough, 1) : billingCursor,
    arrears: Math.round(arrears),
    carryOverBalance: Math.round(credit + cyclePaid),
    daysOverdue,
    daysRemaining,
    monthsAdvance,
    totalPaid: Math.round(totalPaid),
  };
}

function enrichCustomersWithBilling(customers, paymentsByCustomer = new Map()) {
  return customers.map((customer) => {
    const payments = paymentsByCustomer.get(String(customer._id)) || [];
    const billingInfo = computeBilling({ ...customer, payments });

    return {
      ...customer,
      ...billingInfo,
    };
  });
}

module.exports = {
  computeBilling,
  enrichCustomersWithBilling,
};
