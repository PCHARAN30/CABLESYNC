const Payment = require("../models/Payment");
const Customer = require("../models/Customer");
const Counter = require("../models/Counter");
const { computeBilling } = require("../services/billingService");
const { logActivity, monthName } = require("../utils/activityLog");
const { startOfDay, endOfDay } = require("../utils/date");

function parsePaymentDate(value) {
  if (!value) return startOfDay(new Date());

  // HTML <input type="date"> sends YYYY-MM-DD. Construct at noon so the
  // calendar date remains stable across UTC/local timezone conversions.
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    const [year, month, day] = String(value).split("-").map(Number);
    const parsed = new Date(year, month - 1, day, 12, 0, 0, 0);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid payment date");
  }
  return parsed;
}

function validateAmount(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Payment amount must be greater than zero");
  }
  return amount;
}

// POST /payments
async function createPayment(req, res) {
  try {
    const { customerId, paymentMode, notes } = req.body;
    const amount = validateAmount(req.body.amount);
    const paymentTimestamp = parsePaymentDate(req.body.paymentDate);

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    // Do not allow future collections. Backdated entries remain supported.
    if (startOfDay(paymentTimestamp) > startOfDay(new Date())) {
      return res.status(400).json({ error: "Payment date cannot be in the future" });
    }

    // Prevent accidental duplicate submissions within a short time frame.
    const tenSecondsAgo = new Date(Date.now() - 10000);
    const recentDuplicate = await Payment.findOne({
      customerId,
      amount,
      paymentMode,
      createdAt: { $gte: tenSecondsAgo },
      deletedAt: null,
    });

    if (recentDuplicate) {
      return res.status(409).json({
        error:
          "Duplicate payment detected. A similar payment was recorded just now.",
      });
    }

    const nextReceiptNumber = await Counter.getNextSequence("receiptNumber");

    const payment = await Payment.create({
      customerId,
      amount,
      paidMonth: paymentTimestamp.getMonth() + 1,
      paidYear: paymentTimestamp.getFullYear(),
      paymentDate: paymentTimestamp,
      paymentMode: paymentMode || "Cash",
      notes,
      receiptNumber: nextReceiptNumber,
    });

    // Recalculate from the complete ledger. This is the single source of
    // truth for arrears, paid-through date and advance months.
    const allPayments = await Payment.find(
      { customerId: customer._id, deletedAt: null },
      { amount: 1, paymentDate: 1 },
    ).lean();

    const updatedBilling = computeBilling({
      createdAt: customer.createdAt,
      monthlyFee: customer.monthlyFee,
      payments: allPayments,
      now: new Date(),
    });

    // Keep the cached status synchronized for any older endpoint that reads
    // Customer.status directly. The live billing calculation remains the
    // source of truth everywhere else.
    customer.status = updatedBilling.status;
    await customer.save();

    await logActivity(
      customer._id,
      "PAYMENT_ADDED",
      `Payment of ₹${payment.amount.toLocaleString("en-IN")} recorded for ${monthName(payment.paidMonth)} ${payment.paidYear} (${payment.paymentMode})`,
    );

    res.status(201).json({
      payment,
      updatedBilling,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// GET /payments/customer/:id
// Optional ?year=2026 to filter to one year for the history view.
async function getPaymentsByCustomer(req, res) {
  try {
    const filter = { customerId: req.params.id, deletedAt: null };
    if (req.query.year) filter.paidYear = Number(req.query.year);

    const payments = await Payment.find(filter).sort({
      paymentDate: -1,
      createdAt: -1,
    });
    res.json(payments);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// DELETE /payments/:id
// Soft delete - sets deletedAt instead of removing the document.
async function deletePayment(req, res) {
  try {
    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      { deletedAt: new Date() },
      { new: true },
    );
    if (!payment) return res.status(404).json({ error: "Payment not found" });

    const customer = await Customer.findById(payment.customerId);
    let updatedBilling = null;

    if (customer) {
      const allPayments = await Payment.find(
        { customerId: customer._id, deletedAt: null },
        { amount: 1, paymentDate: 1 },
      ).lean();

      updatedBilling = computeBilling({
        createdAt: customer.createdAt,
        monthlyFee: customer.monthlyFee,
        payments: allPayments,
        now: new Date(),
      });

      customer.status = updatedBilling.status;
      await customer.save();
    }

    await logActivity(
      payment.customerId,
      "PAYMENT_DELETED",
      `Payment of ₹${payment.amount.toLocaleString("en-IN")} for ${monthName(payment.paidMonth)} ${payment.paidYear} deleted`,
    );

    res.json({ message: "Payment deleted", payment, updatedBilling });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// GET /payments/today
async function getTodaysCollection(req, res) {
  try {
    const today = new Date();
    const payments = await Payment.find({
      paymentDate: { $gte: startOfDay(today), $lte: endOfDay(today) },
      deletedAt: null,
    })
      .populate("customerId", "name phone serialNumber")
      .sort({ paymentDate: -1 });

    const total = payments.reduce((sum, p) => sum + p.amount, 0);
    res.json({ count: payments.length, total, payments });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// POST /payments/preview
// Simulates a payment without saving it.
async function previewPayment(req, res) {
  try {
    const { customerId } = req.body;
    const amount = validateAmount(req.body.amount);
    const paymentTimestamp = parsePaymentDate(req.body.paymentDate);

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    const existingPayments = await Payment.find(
      { customerId: customer._id, deletedAt: null },
      { amount: 1, paymentDate: 1 },
    ).lean();

    const simulatedPayments = [
      ...existingPayments,
      { amount, paymentDate: paymentTimestamp },
    ];

    const previewBilling = computeBilling({
      createdAt: customer.createdAt,
      monthlyFee: customer.monthlyFee,
      payments: simulatedPayments,
      now: new Date(),
    });

    res.json({
      ...previewBilling,
      paymentDate: paymentTimestamp,
      paymentAmount: amount,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = {
  createPayment,
  getPaymentsByCustomer,
  deletePayment,
  getTodaysCollection,
  previewPayment,
};
