const Customer = require("../models/Customer");
const Payment = require("../models/Payment");
const Counter = require("../models/Counter");
const ActivityLog = require("../models/ActivityLog");
const { logActivity } = require("../utils/activityLog");
const {
  enrichCustomersWithBilling,
  hydrateCustomerBilling,
  getCustomerPayments,
  computeBilling,
} = require("../services/billingService");

const DEMO_CUSTOMERS = [
  {
    serialNumber: 1,
    name: "Aadhya Kumar",
    phone: "9123456789",
    cafNumber: "CAF100101",
    address: "12 Green Street",
    area: "Santhapet",
    pon: "PN1001",
    monthlyFee: 370,
    isActive: true,
    status: "DUE",
    createdAt: new Date("2026-02-01T08:00:00.000Z"),
    updatedAt: new Date("2026-02-01T08:00:00.000Z"),
  },
  {
    serialNumber: 2,
    name: "Bhavya Rao",
    phone: "9876543210",
    cafNumber: "CAF100102",
    address: "83 Lotus Avenue",
    area: "Maruthi Nagar",
    pon: "PN1002",
    monthlyFee: 500,
    isActive: true,
    status: "DUE",
    createdAt: new Date("2026-03-15T08:00:00.000Z"),
    updatedAt: new Date("2026-03-15T08:00:00.000Z"),
  },
  {
    serialNumber: 3,
    name: "Chaitanya Reddy",
    phone: "9012345678",
    cafNumber: "CAF100103",
    address: "47 Sunrise Road",
    area: "BCPALLI",
    pon: "PN1003",
    monthlyFee: 270,
    isActive: true,
    status: "DUE",
    createdAt: new Date("2026-01-20T08:00:00.000Z"),
    updatedAt: new Date("2026-01-20T08:00:00.000Z"),
  },
  {
    serialNumber: 4,
    name: "Divya Sharma",
    phone: "9988776655",
    cafNumber: "CAF100104",
    address: "21 Pearl Lane",
    area: "Kothapeta",
    pon: "PN1004",
    monthlyFee: 370,
    isActive: true,
    status: "DUE",
    createdAt: new Date("2026-04-10T08:00:00.000Z"),
    updatedAt: new Date("2026-04-10T08:00:00.000Z"),
  },
  {
    serialNumber: 5,
    name: "Eesha Patel",
    phone: "9898989898",
    cafNumber: "CAF100105",
    address: "56 Ocean View",
    area: "Santhapet",
    pon: "PN1005",
    monthlyFee: 500,
    isActive: true,
    status: "DUE",
    createdAt: new Date("2026-05-01T08:00:00.000Z"),
    updatedAt: new Date("2026-05-01T08:00:00.000Z"),
  },
];

// GET /customers
// Returns active customers by default. Pass ?includeInactive=true to see all.
// Also supports filtering by q (search), status, and area.
async function getCustomers(req, res) {
  try {
    const {
      q,
      status: statusFilter,
      area: areaFilter,
      includeInactive,
      page = 1,
      limit = 20,
    } = req.query;

    const query = includeInactive === "true" ? {} : { isActive: true };

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    if (areaFilter) {
      query.area = areaFilter;
    }

    if (q) {
      const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      const searchFields = [
        { name: regex },
        { phone: regex },
        { cafNumber: regex },
        { address: regex },
        { area: regex },
        { pon: regex },
      ];
      // Only add serialNumber to search if q is a valid number
      if (!isNaN(q)) {
        searchFields.push({ serialNumber: Number(q) });
      }
      query.$or = searchFields;
    }

    const totalCustomers = await Customer.countDocuments(query);
    const customers = await Customer.find(query).sort({ name: 1 }).lean();

    // To show "Paid Till" on the customer card, we need the paidThroughDate.
    // Instead of N+1 queries, we fetch all payments once and compute in-memory.
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

    let customersWithBilling = enrichCustomersWithBilling(
      customers,
      paymentsByCustomer,
    );

    if (statusFilter) {
      const normalizedStatus = statusFilter.toUpperCase();
      customersWithBilling = customersWithBilling.filter(
        (customer) => customer.status === normalizedStatus,
      );
    }

    const filteredTotalCustomers = statusFilter
      ? customersWithBilling.length
      : totalCustomers;
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedCustomers = customersWithBilling.slice(
      startIndex,
      startIndex + limitNum,
    );

    res.status(200).json({
      success: true,
      data: {
        customers: paginatedCustomers,
        currentPage: pageNum,
        totalPages: Math.ceil(filteredTotalCustomers / limitNum),
        totalCustomers: filteredTotalCustomers,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /customers/:id
async function getCustomerById(req, res) {
  try {
    const customer = await Customer.findById(req.params.id).lean();
    if (!customer)
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });

    const customerWithBilling = await hydrateCustomerBilling(customer);
    res.status(200).json({ success: true, data: customerWithBilling });
  } catch (err) {
    // Invalid ObjectId (CastError) -> client error; other errors are server-side
    if (err.name === 'CastError' || err.kind === 'ObjectId') {
      return res.status(400).json({ success: false, message: 'Invalid customer id' });
    }
    console.error('getCustomerById error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// POST /customers
async function createCustomer(req, res) {
  try {
    // Serial number is generated by the backend. The frontend keeps its
    // existing field names; this endpoint normalizes only transport values.
    const { serialNumber, ...rawCustomerData } = req.body;
    const customerData = {
      name: String(rawCustomerData.name || "").trim(),
      phone: String(rawCustomerData.phone || "").replace(/\D/g, "").slice(-10),
      cafNumber: String(rawCustomerData.cafNumber || "").trim(),
      address: String(rawCustomerData.address || "").trim(),
      area: String(rawCustomerData.area || "").trim(),
      pon: String(rawCustomerData.pon || "").trim(),
      monthlyFee: Number(rawCustomerData.monthlyFee),
      isActive: true,
      status: "DUE",
    };

    if (!customerData.name || !customerData.cafNumber || !customerData.phone) {
      return res.status(400).json({
        success: false,
        message: "Name, phone and CAF number are required",
      });
    }

    if (!/^[6-9]\d{9}$/.test(customerData.phone)) {
      return res.status(400).json({
        success: false,
        message: "Valid Indian phone number is required",
      });
    }

    if (!Number.isFinite(customerData.monthlyFee) || customerData.monthlyFee <= 0) {
      return res.status(400).json({
        success: false,
        message: "Monthly fee must be a positive number",
      });
    }

    const existingCustomer = await Customer.findOne({
      cafNumber: customerData.cafNumber,
    });
    if (existingCustomer) {
      return res
        .status(409)
        .json({ success: false, message: "CAF number already exists" });
    }

    const nextSerialNumber = await Counter.getNextSequence(
      "customerSerialNumber",
    );

    const customer = await Customer.create({
      ...customerData,
      serialNumber: nextSerialNumber,
    });

    await logActivity(
      customer._id,
      "CUSTOMER_CREATED",
      `Customer added (Serial ${customer.serialNumber})`,
    );
    res.status(201).json({ success: true, data: customer });
  } catch (err) {
    if (err.code === 11000 && err.keyPattern?.cafNumber) {
      return res
        .status(409)
        .json({ success: false, message: "CAF number already exists" });
    }
    if (err.code === 11000 && err.keyPattern?.serialNumber) {
      return res
        .status(409)
        .json({ success: false, message: "Serial number already exists" });
    }
    res.status(400).json({ success: false, message: err.message });
  }
}

// PUT /customers/:id
// Logs exactly which fields changed, in plain language, rather than a
// generic "customer updated" note - this is what makes the activity
// timeline actually useful for tracing what happened and when.
const TRACKED_FIELDS = [
  { key: "name", label: "name" },
  { key: "phone", label: "phone" },
  { key: "cafNumber", label: "CAF number" },
  { key: "address", label: "address" },
  { key: "area", label: "area" },
  { key: "pon", label: "PON" },
  { key: "monthlyFee", label: "monthly fee" },
];

async function updateCustomer(req, res) {
  try {
    const before = await Customer.findById(req.params.id);
    if (!before)
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });

    if (
      req.body.cafNumber &&
      req.body.cafNumber !== before.cafNumber
    ) {
      const duplicateCaf = await Customer.findOne({
        cafNumber: req.body.cafNumber,
        _id: { $ne: req.params.id },
      });
      if (duplicateCaf) {
        return res
          .status(409)
          .json({ success: false, message: "CAF number already exists" });
      }
    }

    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    const changes = TRACKED_FIELDS.filter(
      ({ key }) => String(before[key] ?? "") !== String(customer[key] ?? ""),
    ).map(
      ({ key, label }) =>
        `${label}: "${before[key] ?? "—"}" → "${customer[key] ?? "—"}"`,
    );

    if (changes.length > 0) {
      await logActivity(
        customer._id,
        "CUSTOMER_UPDATED",
        `Updated ${changes.join("; ")}`,
      );
    }

    res.status(200).json({ success: true, data: customer });
  } catch (err) {
    if (err.code === 11000 && err.keyPattern?.cafNumber) {
      return res
        .status(409)
        .json({ success: false, message: "CAF number already exists" });
    }
    res.status(400).json({ success: false, message: err.message });
  }
}

// DELETE /customers/:id
// Soft delete only - flips isActive to false. Payment history is preserved.
// Use ?hard=true only for genuine mistakes (e.g. test data), never for
// real disconnected customers.
// New logic: Hard delete is only allowed if there are no payments.
async function deleteCustomer(req, res) {
  try {
    const customerId = req.params.id;
    const customer = await Customer.findById(customerId);

    if (!customer) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    }

    const paymentCount = await Payment.countDocuments({ customerId });

    // Case 1: Customer has payment history -> SOFT DELETE
    if (paymentCount > 0) {
      if (!customer.isActive) {
        return res
          .status(400)
          .json({ success: false, message: "Customer is already inactive" });
      }
      customer.isActive = false;
      customer.status = "INACTIVE";
      await customer.save();
      await logActivity(
        customerId,
        "CUSTOMER_DEACTIVATED",
        "Customer marked as inactive due to existing payment history.",
      );
      return res.status(200).json({
        success: true,
        message: "Customer marked as inactive",
        deletedType: "soft",
        data: customer,
      });
    }

    // Case 2: Customer has NO payment history -> HARD DELETE
    await Customer.findByIdAndDelete(customerId);
    // Also clean up any related activity logs for the deleted customer
    await ActivityLog.deleteMany({ customerId });

    // No activity log for a hard delete as the customerId no longer exists.
    // The action is final.

    return res
      .status(200)
      .json({ success: true, message: "Customer permanently deleted", deletedType: "hard" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

// PATCH /customers/:id/restore
// Reactivates a customer that was soft-deleted (isActive:false). Powers the
// "Undo" toast shown right after a delete — only works within the window
// before the client discards the undo option; a hard-deleted customer (one
// with no payment history) cannot be restored since the record is gone.
async function restoreCustomer(req, res) {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    }
    if (customer.isActive) {
      return res
        .status(400)
        .json({ success: false, message: "Customer is already active" });
    }

    customer.isActive = true;
    await customer.save();

    await logActivity(customer._id, "CUSTOMER_RESTORED", "Customer restored after deletion.");

    return res.status(200).json({ success: true, data: customer });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

// POST /customers/reset
// Hidden utility endpoint for restoring a clean demo dataset.
async function resetCustomers(req, res) {
  try {
    await Promise.all([
      Customer.deleteMany({}),
      Payment.deleteMany({}),
      ActivityLog.deleteMany({}),
    ]);

    const createdCustomers = await Customer.insertMany(DEMO_CUSTOMERS);
    const maxSerial = createdCustomers.length > 0 ? Math.max(...createdCustomers.map((c) => c.serialNumber)) : 0;
    await Counter.findByIdAndUpdate(
      "customerSerialNumber",
      { seq: maxSerial },
      { new: true, upsert: true },
    );

    res.status(200).json({
      success: true,
      message: `Restored ${createdCustomers.length} demo customers.`,
      count: createdCustomers.length,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /customers/:id/due-status
// Computed live from the ledger model in utils/billing.js: running balance
// = total paid - total billed since signup. See README "Payment Logic"
// section for why this replaces the old "check the last payment's month"
// approach, and for worked examples of partial payments and advance payments.
async function getDueStatus(req, res) {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer)
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });

    const payments = await getCustomerPayments(customer._id);
    const billing = computeBilling({
      createdAt: customer.createdAt,
      monthlyFee: customer.monthlyFee,
      payments,
    });

    const lastPayment = await Payment.findOne({
      customerId: customer._id,
      deletedAt: null,
    }).sort({ paymentDate: -1 });

    res.status(200).json({
      success: true,
      data: {
        customerId: customer._id,
        ...billing,
        lastPayment: lastPayment || null,
      },
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

// GET /customers/:id/activity
// The auto-generated system note timeline - payments and edits only,
// never operator-written free text, so it stays a reliable audit trail.
async function getActivity(req, res) {
  try {
    const logs = await ActivityLog.find({ customerId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.status(200).json({ success: true, data: logs });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  restoreCustomer,
  resetCustomers,
  getDueStatus,
  getActivity,
};
