const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const connectDB = require("../config/db");
const Customer = require("../models/Customer");
const Payment = require("../models/Payment");
const ActivityLog = require("../models/ActivityLog");
const Counter = require("../models/Counter");

async function resetDatabase() {
  await connectDB();
  console.log("Connected to MongoDB, clearing customer data...");

  const [customersResult, paymentsResult, logsResult] = await Promise.all([
    Customer.deleteMany({}),
    Payment.deleteMany({}),
    ActivityLog.deleteMany({}),
  ]);

  await Promise.all([
    Counter.findByIdAndUpdate(
      "customerSerialNumber",
      { seq: 0 },
      { new: true, upsert: true },
    ),
    Counter.findByIdAndUpdate(
      "receiptNumber",
      { seq: 0 },
      { new: true, upsert: true },
    ),
  ]);

  console.log(`Deleted ${customersResult.deletedCount} customers.`);
  console.log(`Deleted ${paymentsResult.deletedCount} payments.`);
  console.log(`Deleted ${logsResult.deletedCount} activity logs.`);
  console.log("Reset customerSerialNumber counter to 0.");

  process.exit(0);
}

resetDatabase().catch((err) => {
  console.error("Failed to reset database:", err);
  process.exit(1);
});
