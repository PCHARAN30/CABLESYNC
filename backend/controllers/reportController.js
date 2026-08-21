const Customer = require("../models/Customer");
const Payment = require("../models/Payment");
const { hydrateCustomersWithBilling } = require("../services/billingService");

/**
 * Generates a report of all customers with outstanding dues (Partial or Due status).
 * This is a key report for daily collection activities.
 *
 * @route GET /api/reports/pending-dues
 */
async function getPendingDues(req, res) {
  try {
    // 1. Fetch all active customers
    const customers = await Customer.find({ isActive: true })
      .select("_id name phone area monthlyFee createdAt")
      .lean();

    // 2. Compute billing status for each customer and filter for those with dues
    const customersWithBilling = await hydrateCustomersWithBilling(customers);
    const pendingCustomers = customersWithBilling
      .filter((c) => c.status === "DUE" || c.status === "PARTIAL")
      .sort((a, b) => b.arrears - a.arrears); // Sort by highest due amount first

    // 4. Calculate the grand total of all pending dues
    const totalPendingAmount = pendingCustomers.reduce(
      (sum, c) => sum + c.arrears,
      0,
    );

    res.json({
      totalPendingAmount,
      count: pendingCustomers.length,
      customers: pendingCustomers,
    });
  } catch (err) {
    res.status(500).json({
      error: "Failed to generate pending dues report: " + err.message,
    });
  }
}

async function getMonthlyCollection(req, res) {
  try {
    const now = new Date();
    const year = Number(req.query.year) || now.getFullYear();
    const month = Number(req.query.month) || now.getMonth() + 1;
    const [customers, totals] = await Promise.all([
      Customer.find({ isActive: true }).select("monthlyFee").lean(),
      Payment.aggregate([
        { $match: { deletedAt: null, paidYear: year, paidMonth: month } },
        { $group: { _id: null, collected: { $sum: "$amount" }, payments: { $sum: 1 } } },
      ]),
    ]);
    const billed = customers.reduce((sum, customer) => sum + customer.monthlyFee, 0);
    const collected = totals[0]?.collected || 0;
    res.json({ year, month, billed, collected, payments: totals[0]?.payments || 0, outstanding: Math.max(0, billed - collected), collectionRate: billed ? Number(((collected / billed) * 100).toFixed(1)) : 0 });
  } catch (err) { res.status(500).json({ error: "Failed to generate monthly collection: " + err.message }); }
}

async function getAreaCollection(req, res) {
  try {
    const now = new Date();
    const year = Number(req.query.year) || now.getFullYear();
    const month = Number(req.query.month) || now.getMonth() + 1;
    const [areas, payments] = await Promise.all([
      Customer.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: { $ifNull: ["$area", "Unassigned"] }, customers: { $sum: 1 }, billed: { $sum: "$monthlyFee" } } },
      ]),
      Payment.aggregate([
        { $match: { deletedAt: null, paidYear: year, paidMonth: month } },
        { $lookup: { from: "customers", localField: "customerId", foreignField: "_id", as: "customer" } },
        { $unwind: "$customer" },
        { $group: { _id: { $ifNull: ["$customer.area", "Unassigned"] }, collected: { $sum: "$amount" } } },
      ]),
    ]);
    const collectedByArea = new Map(payments.map((entry) => [entry._id, entry.collected]));
    const data = areas.map((area) => ({ area: area._id, customers: area.customers, billed: area.billed, collected: collectedByArea.get(area._id) || 0, outstanding: Math.max(0, area.billed - (collectedByArea.get(area._id) || 0)) })).sort((a, b) => b.outstanding - a.outstanding);
    res.json({ year, month, areas: data });
  } catch (err) { res.status(500).json({ error: "Failed to generate area collection: " + err.message }); }
}

async function getTopDefaulters(req, res) {
  try {
    const customers = await Customer.find({ isActive: true }).select("_id name phone area monthlyFee createdAt").lean();
    const hydrated = await hydrateCustomersWithBilling(customers);
    const defaulters = hydrated.filter((customer) => customer.status === "DUE" || customer.status === "PARTIAL").sort((a, b) => b.arrears - a.arrears).slice(0, 20);
    res.json({ count: defaulters.length, totalOutstanding: defaulters.reduce((sum, customer) => sum + customer.arrears, 0), customers: defaulters });
  } catch (err) { res.status(500).json({ error: "Failed to generate top defaulters: " + err.message }); }
}

async function getCollectionTrend(req, res) {
  try {
    const now = new Date();
    const periods = Array.from({ length: 6 }, (_, index) => new Date(now.getFullYear(), now.getMonth() - (5 - index), 1));
    const start = periods[0];
    const grouped = await Payment.aggregate([
      { $match: { deletedAt: null, paymentDate: { $gte: start } } },
      { $group: { _id: { year: "$paidYear", month: "$paidMonth" }, collected: { $sum: "$amount" }, payments: { $sum: 1 } } },
    ]);
    const values = new Map(grouped.map((entry) => [`${entry._id.year}-${entry._id.month}`, entry]));
    const trend = periods.map((date) => { const year = date.getFullYear(); const month = date.getMonth() + 1; const entry = values.get(`${year}-${month}`); return { year, month, collected: entry?.collected || 0, payments: entry?.payments || 0 }; });
    res.json({ trend });
  } catch (err) { res.status(500).json({ error: "Failed to generate collection trend: " + err.message }); }
}

module.exports = { getPendingDues, getMonthlyCollection, getAreaCollection, getTopDefaulters, getCollectionTrend };
