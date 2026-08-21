const Payment = require("../models/Payment");
const {
  computeBilling,
  enrichCustomersWithBilling,
} = require("../utils/billing");

// Fetches the full (non-deleted) payment history for a set of customers,
// grouped by customer id. The billing engine needs each payment's date,
// not just a summed total, so it can anchor 30-day cycles correctly.
async function getPaymentsByCustomerMap(customerIds = []) {
  if (!Array.isArray(customerIds) || customerIds.length === 0) {
    return new Map();
  }

  const payments = await Payment.find(
    { deletedAt: null, customerId: { $in: customerIds } },
    { customerId: 1, amount: 1, paymentDate: 1 },
  ).lean();

  const map = new Map();
  for (const payment of payments) {
    const key = String(payment.customerId);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(payment);
  }
  return map;
}

async function hydrateCustomerBilling(customer) {
  const paymentsByCustomer = await getPaymentsByCustomerMap([customer._id]);
  const payments = paymentsByCustomer.get(String(customer._id)) || [];
  const billingInfo = computeBilling({ ...customer, payments });

  return {
    ...customer,
    ...billingInfo,
  };
}

async function hydrateCustomersWithBilling(customers) {
  const customerIds = customers.map((customer) => customer._id);
  const paymentsByCustomer = await getPaymentsByCustomerMap(customerIds);

  return customers.map((customer) => {
    const payments = paymentsByCustomer.get(String(customer._id)) || [];
    const billingInfo = computeBilling({ ...customer, payments });
    return {
      ...customer,
      ...billingInfo,
    };
  });
}

async function getCustomerPayments(customerId) {
  return Payment.find(
    { deletedAt: null, customerId },
    { amount: 1, paymentDate: 1 },
  ).lean();
}

module.exports = {
  computeBilling,
  enrichCustomersWithBilling,
  getPaymentsByCustomerMap,
  hydrateCustomerBilling,
  hydrateCustomersWithBilling,
  getCustomerPayments,
};
