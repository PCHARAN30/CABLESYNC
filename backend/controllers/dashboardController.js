const Customer = require("../models/Customer");
const Payment = require("../models/Payment");
const { startOfDay, endOfDay } = require("../utils/date");
const { enrichCustomersWithBilling } = require("../services/billingService");

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// GET /dashboard/summary
// Powers the dashboard cards (Total, Paid, Partial, Due, Today's Amount),
// the "expiring soon" list (customers whose paid-through date falls within
// the next 7 days), and the recent-payments feed. All status classification
// uses the ledger model in utils/billing.js, not the cached Customer.status
// field, so the dashboard can never drift from what Customer Details shows.
async function getSummary(req, res) {
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  try {
    const customers = await Customer.find({ isActive: true }).lean();

    const allPayments = await Payment.find(
      { deletedAt: null },
      { customerId: 1, amount: 1, paymentDate: 1 },
    ).lean();
    const paymentsByCustomer = new Map();
    for (const payment of allPayments) {
      const key = String(payment.customerId);
      if (!paymentsByCustomer.has(key)) paymentsByCustomer.set(key, []);
      paymentsByCustomer.get(key).push(payment);
    }

    const customersWithBilling = enrichCustomersWithBilling(
      customers,
      paymentsByCustomer,
    );

    const dueCustomers = customersWithBilling.filter(
      (customer) => customer.status === "DUE",
    );
    const paidCustomers = customersWithBilling.filter(
      (customer) => customer.status === "PAID",
    );
    const partialCustomers = customersWithBilling.filter(
      (customer) => customer.status === "PARTIAL",
    );

    const summaryData = {
      totalCustomers: customersWithBilling.length,
      paidCount: paidCustomers.length,
      partialCount: partialCustomers.length,
      dueCount: dueCustomers.length,
      totalArrears: dueCustomers.reduce(
        (sum, customer) => sum + (customer.arrears || 0),
        0,
      ),
      expiringSoon: customersWithBilling
        .filter((customer) => {
          const paidThroughDate = customer.paidThroughDate;
          return (
            paidThroughDate &&
            paidThroughDate >= todayStart &&
            paidThroughDate <= new Date(todayStart.getTime() + SEVEN_DAYS_MS)
          );
        })
        .map((customer) => ({
          customerId: customer._id,
          name: customer.name,
          paidThroughDate: customer.paidThroughDate,
        }))
        .sort((a, b) => a.paidThroughDate - b.paidThroughDate),
      todaysDueCount: dueCustomers.filter((customer) => {
        const paidThroughDate = customer.paidThroughDate;
        if (!paidThroughDate) return false;
        const normalizedPaidThroughDate = startOfDay(paidThroughDate);
        const yesterday = startOfDay(new Date(todayStart.getTime() - 86400000));
        return normalizedPaidThroughDate.getTime() === yesterday.getTime();
      }).length,
    };

    // Today's collection total
    const todaysPayments = await Payment.find({
      paymentDate: { $gte: todayStart, $lte: todayEnd },
      deletedAt: null,
    });
    const todaysCollection = todaysPayments.reduce(
      (sum, p) => sum + p.amount,
      0,
    );

    // New customers today
    const newCustomersToday = await Customer.countDocuments({
      createdAt: { $gte: todayStart, $lte: todayEnd },
      isActive: true,
    });

    const expectedCollection =
      todaysCollection + (summaryData.totalArrears || 0);
    const collectionPercentage =
      expectedCollection > 0
        ? Math.round((todaysCollection / expectedCollection) * 100)
        : 100;

    // Last 10 payments across all customers, for the "Recent Payments" feed.
    const recentPayments = await Payment.find({ deletedAt: null })
      .populate("customerId", "name")
      .sort({ paymentDate: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        totalCustomers: summaryData.totalCustomers || 0,
        paidCount: summaryData.paidCount || 0,
        partialCount: summaryData.partialCount || 0,
        dueCount: summaryData.dueCount || 0,
        remainingDue: summaryData.totalArrears || 0,
        todaysDueCount: summaryData.todaysDueCount || 0,
        todaysCollection,
        newCustomersToday,
        expectedCollection,
        collectionPercentage,
        expiringSoon: summaryData.expiringSoon || [],
        recentPayments,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { getSummary };
