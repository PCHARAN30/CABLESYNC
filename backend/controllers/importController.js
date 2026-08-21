const Customer = require("../models/Customer");
const Counter = require("../models/Counter");
const { logActivity } = require("../utils/activityLog");

/**
 * @route POST /import/preview
 * Analyzes a list of customer records for import without saving them.
 * It checks for duplicates based on cafNumber and validates required fields.
 */
async function previewImport(req, res) {
  try {
    const records = req.body.records;
    if (!Array.isArray(records)) {
      return res.status(400).json({ error: "Expected an array of records." });
    }

    const validRows = [];
    const duplicateRows = [];
    const invalidRows = [];

    const existingCafNumbers = new Set(
      (await Customer.find({}, "cafNumber").lean()).map((c) => c.cafNumber),
    );
    const cafNumbersInFile = new Set();

    for (const record of records) {
      const { name, phone, cafNumber, monthlyFee } = record;

      // Rule: Missing required fields
      if (!name || !phone || !cafNumber || !monthlyFee) {
        record.error =
          "Missing required fields (name, phone, cafNumber, monthlyFee).";
        invalidRows.push(record);
        continue;
      }

      // Rule: Duplicate within the database
      if (existingCafNumbers.has(cafNumber)) {
        record.error = "CAF Number already exists in the database.";
        duplicateRows.push(record);
        continue;
      }

      // Rule: Duplicate within the same file
      if (cafNumbersInFile.has(cafNumber)) {
        record.error = "CAF Number is duplicated within the file.";
        duplicateRows.push(record);
        continue;
      }

      validRows.push(record);
      cafNumbersInFile.add(cafNumber);
    }

    res.json({
      summary: {
        valid: validRows.length,
        duplicates: duplicateRows.length,
        invalid: invalidRows.length,
        total: records.length,
      },
      validRows,
      duplicateRows,
      invalidRows,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to preview import: " + err.message });
  }
}

/**
 * @route POST /import/execute
 * Executes the import of a validated list of customer records.
 */
async function executeImport(req, res) {
  try {
    const recordsToImport = req.body.records;
    if (!Array.isArray(recordsToImport)) {
      return res.status(400).json({ error: "Expected an array of records." });
    }

    const createdCustomers = [];
    for (const record of recordsToImport) {
      const nextSerialNumber = await Counter.getNextSequence(
        "customerSerialNumber",
      );
      const customer = await Customer.create({
        ...record,
        serialNumber: nextSerialNumber,
        monthlyFee: Number(record.monthlyFee),
      });

      await logActivity(
        customer._id,
        "CUSTOMER_CREATED",
        `Customer imported from CSV (Serial ${customer.serialNumber})`,
      );
      createdCustomers.push(customer);
    }

    res.status(201).json({
      message: `Successfully imported ${createdCustomers.length} customers.`,
      count: createdCustomers.length,
      customers: createdCustomers,
    });
  } catch (err) {
    // This could happen if a duplicate slips past the preview (race condition)
    if (err.code === 11000) {
      return res
        .status(409)
        .json({
          error:
            "A duplicate CAF number was found during import. The process was halted.",
        });
    }
    res.status(500).json({ error: "Failed to execute import: " + err.message });
  }
}

module.exports = {
  previewImport,
  executeImport,
};
