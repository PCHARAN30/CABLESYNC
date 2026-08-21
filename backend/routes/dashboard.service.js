const Customer = require("../models/customer.model");
const Payment = require("../models/payment.model");

class DashboardService {
  static async getSummary() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Today's Collection: Sum of today's payments
    const todaysPayments = await Payment.find({
      paymentDate: { $gte: today, $lt: tomorrow },
    });
    const todaysCollection = todaysPayments.reduce(
      (sum, p) => sum + p.amount,
      0,
    );

    // Customer Counts based on new business rules
    const totalCustomers = await Customer.countDocuments({ isActive: true });

    // Paid Customers: outstandingBalance is 0 or less
    const paidCount = await Customer.countDocuments({
      isActive: true,
      outstandingBalance: { $lte: 0 },
    });

    // Due Customers: outstandingBalance is >= one month's fee
    const dueCount = await Customer.countDocuments({
      isActive: true,
      $expr: { $gte: ["$outstandingBalance", "$monthlyFee"] },
    });

    // Partial Customers: 0 < outstandingBalance < monthlyFee
    const partialCount = await Customer.countDocuments({
      isActive: true,
      $expr: {
        $and: [
          { $gt: ["$outstandingBalance", 0] },
          { $lt: ["$outstandingBalance", "$monthlyFee"] },
        ],
      },
    });

    // Recent Payments: Last 10 payments
    const recentPayments = await Payment.find()
      .sort({ paymentDate: -1 })
      .limit(10)
      .populate("customerId", "name");

    return {
      totalCustomers,
      paidCount,
      dueCount,
      partialCount,
      todaysCollection,
      recentPayments,
      // Other stats can be added here as needed by the dashboard
      todaysDueCount: dueCount, // Assuming this is what the dashboard needs
    };
  }
}

module.exports = DashboardService;
