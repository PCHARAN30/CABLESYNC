const Customer = require("../models/Customer");
const Payment = require("../models/Payment");
const { hydrateCustomersWithBilling } = require("../services/billingService");

/**
 * Converts an array of objects to a CSV string.
 * Handles escaping of commas and quotes.
 */
function toCsv(headers, data) {
  const escape = (val) => {
    if (
      typeof val === "string" &&
      (val.includes(",") || val.includes('"') || val.includes("\n"))
    ) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const headerRow = headers.map((h) => h.label).join(",");
  const dataRows = data.map((row) =>
    headers.map((header) => escape(row[header.key] ?? "")).join(","),
  );

  return [headerRow, ...dataRows].join("\n");
}

/**
 * @route POST /export/csv
 * Generates a CSV file of customer data.
 * For now, it exports all active customers.
 */
async function exportCustomersCSV(req, res) {
  try {
    // 1. Fetch all active customers
    const customers = await Customer.find({ isActive: true })
      .sort({ serialNumber: 1 })
      .lean();

    // 2. Compute billing status for each customer.
    const customersWithBilling = await hydrateCustomersWithBilling(customers);
    const dataForExport = customersWithBilling.map((customer) => ({
      serialNumber: customer.serialNumber,
      name: customer.name,
      phone: customer.phone,
      cafNumber: customer.cafNumber,
      area: customer.area,
      address: customer.address,
      monthlyFee: customer.monthlyFee,
      status: customer.status,
      arrears: customer.arrears,
      paidThroughDate: customer.paidThroughDate.toISOString().split("T")[0], // Format as YYYY-MM-DD
    }));

    const headers = [
      { key: "serialNumber", label: "Serial Number" },
      { key: "name", label: "Name" },
      { key: "phone", label: "Phone" },
      { key: "cafNumber", label: "CAF Number" },
      { key: "area", label: "Area" },
      { key: "address", label: "Address" },
      { key: "monthlyFee", label: "Monthly Fee" },
      { key: "status", label: "Status" },
      { key: "arrears", label: "Dues (INR)" },
      { key: "paidThroughDate", label: "Paid Till" },
    ];

    const csvData = toCsv(headers, dataForExport);

    res.header("Content-Type", "text/csv");
    res.attachment("cablesync_customers.csv");
    res.send(csvData);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to generate CSV export: " + err.message });
  }
}

module.exports = { exportCustomersCSV };
