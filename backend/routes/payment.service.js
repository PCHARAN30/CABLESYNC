const Customer = require("../models/customer.model");
const Payment = require("../models/payment.model");
const { logActivity } = require("../utils/activityLog");

class PaymentService {
  /**
   * Processes a new payment, calculates the customer's new billing status,
   * and updates their record.
   * @param {object} paymentData - The details of the payment being made.
   * @returns {Promise<object>} - The saved payment and the updated billing status.
   */
  static async processPayment(paymentData) {
    const { customerId, amount } = paymentData;
    const customer = await Customer.findById(customerId);
    if (!customer) {
      throw new Error("Customer not found");
    }

    let { outstandingBalance, validTill, monthlyFee } = customer;
    let paymentAmount = amount;

    // Rule: Start with the existing outstanding balance.
    let newOutstanding = outstandingBalance;

    // Rule: Apply the payment to the outstanding balance.
    newOutstanding -= paymentAmount;

    let newValidTill = new Date(validTill);

    // Rule: If the payment clears at least one full month's fee.
    // This loop handles both full and advance payments.
    while (newOutstanding <= 0 && monthlyFee > 0) {
      // Business Rule: The validity period starts from the end of the last paid period.
      // If they are overdue, the new period starts from today.
      const startDate = newValidTill < new Date() ? new Date() : newValidTill;

      // Business Rule: Extend validity by 30 days for each full month paid.
      newValidTill.setDate(startDate.getDate() + 30);

      // Add the next month's fee to the outstanding balance and continue the loop
      // if the customer has paid in advance.
      newOutstanding += monthlyFee;
    }

    // Update customer's billing state
    customer.outstandingBalance = newOutstanding < 0 ? 0 : newOutstanding;
    customer.validTill = newValidTill;
    customer.lastPaymentDate = new Date();

    await customer.save();

    // Create the payment record
    const payment = new Payment(paymentData);
    await payment.save();

    // Log this activity
    await logActivity(
      customerId,
      "PAYMENT_ADDED",
      `Payment of ₹${amount} received.`,
    );

    // The frontend expects the updated billing status to be returned.
    const updatedBilling = await this.getBillingStatus(customerId);

    return { payment, updatedBilling };
  }

  /**
   * Calculates the current billing status of a customer.
   * This is a read-only operation.
   * @param {string} customerId - The ID of the customer.
   * @returns {Promise<object>} - The customer's billing status.
   */
  static async getBillingStatus(customerId) {
    const customer = await Customer.findById(customerId);
    if (!customer) {
      throw new Error("Customer not found");
    }

    const { outstandingBalance, monthlyFee, validTill, lastPaymentDate } =
      customer;
    let status;

    // Business Rule: Determine status based on outstanding balance.
    if (outstandingBalance <= 0) {
      status = "PAID";
    } else if (outstandingBalance < monthlyFee) {
      status = "PARTIAL";
    } else {
      status = "DUE";
    }

    return {
      status,
      arrears: outstandingBalance, // Frontend expects 'arrears'
      paidThroughDate: validTill,
      nextDueDate: validTill, // Simplified for this logic
      lastPaymentDate,
      monthsAdvance: 0, // This can be enhanced later if needed
    };
  }
}

module.exports = PaymentService;
