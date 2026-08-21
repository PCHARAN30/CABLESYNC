const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { faker } = require("@faker-js/faker");

const Customer = require("./models/Customer");
const Payment = require("./models/Payment");
const ActivityLog = require("./models/ActivityLog");
const Counter = require("./models/Counter");

dotenv.config();

const AREAS = [
  "BCPALLI",
  "Kothapeta",
  "Gajulapeta",
  "Maruthi Nagar",
  "Santhapet",
];
const PLANS = [
  { fee: 270, name: "Basic" },
  { fee: 370, name: "Standard" },
  { fee: 500, name: "Premium" },
];

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generatePhoneNumber() {
  const prefixes = ["9", "8", "7", "6"];
  return `${getRandomElement(prefixes)}${faker.string.numeric(9)}`;
}

async function seedDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected for seeding...");

    console.log("Clearing existing data...");
    await Customer.deleteMany({});
    await Payment.deleteMany({});
    await ActivityLog.deleteMany({});
    await Counter.deleteMany({});
    console.log("Data cleared.");

    const customers = [];
    const payments = [];
    const activities = [];

    const customerCount = 75;
    console.log(`Generating ${customerCount} customers...`);

    for (let i = 0; i < customerCount; i++) {
      const plan = getRandomElement(PLANS);
      const serialNumber = i + 1;
      const cafNumber = `CAF${100000 + serialNumber}`;

      const customer = {
        _id: new mongoose.Types.ObjectId(),
        serialNumber,
        cafNumber,
        name: faker.person.fullName(),
        phone: generatePhoneNumber(),
        address: `${faker.location.streetAddress()}, ${getRandomElement(AREAS)}`,
        area: getRandomElement(AREAS),
        monthlyFee: plan.fee,
        pon: faker.string.alphanumeric({ length: 12, casing: "upper" }),
        createdAt: faker.date.past({ years: 3 }),
        isActive: true,
        status: "DUE", // Will be re-calculated by payments
      };
      customers.push(customer);

      activities.push({
        customerId: customer._id,
        action: "CUSTOMER_CREATED",
        message: `Customer added (Serial ${customer.serialNumber})`,
        createdAt: customer.createdAt,
      });

      // --- Generate Payment History ---
      const now = new Date();
      const monthsSinceCreation =
        (now.getFullYear() - customer.createdAt.getFullYear()) * 12 +
        (now.getMonth() - customer.createdAt.getMonth());

      let totalPaid = 0;
      const paymentScenario = Math.random();

      // Scenario 1: Good payer, sometimes pays in advance (20% chance)
      if (paymentScenario < 0.2) {
        const monthsToPay =
          monthsSinceCreation + faker.number.int({ min: 1, max: 3 });
        for (let j = 0; j < monthsToPay; j++) {
          const paymentDate = new Date(customer.createdAt);
          paymentDate.setMonth(paymentDate.getMonth() + j);
          if (paymentDate > now) break;

          const amount = customer.monthlyFee;
          totalPaid += amount;
          payments.push({
            customerId: customer._id,
            amount,
            paidMonth: paymentDate.getMonth() + 1,
            paidYear: paymentDate.getFullYear(),
            paymentDate,
            paymentMode: "UPI",
            createdAt: paymentDate,
          });
        }
      }
      // Scenario 2: Mostly regular payer (50% chance)
      else if (paymentScenario < 0.7) {
        const monthsToPay = Math.max(
          0,
          monthsSinceCreation - faker.number.int({ min: 0, max: 2 }),
        );
        for (let j = 0; j < monthsToPay; j++) {
          const paymentDate = new Date(customer.createdAt);
          paymentDate.setMonth(paymentDate.getMonth() + j);
          paymentDate.setDate(faker.number.int({ min: 1, max: 15 }));
          if (paymentDate > now) break;

          const amount = customer.monthlyFee;
          totalPaid += amount;
          payments.push({
            customerId: customer._id,
            amount,
            paidMonth: paymentDate.getMonth() + 1,
            paidYear: paymentDate.getFullYear(),
            paymentDate,
            paymentMode: "Cash",
            createdAt: paymentDate,
          });
        }
      }
      // Scenario 3: Partial/irregular payer (30% chance)
      else {
        const monthsToPay = Math.max(
          1,
          monthsSinceCreation - faker.number.int({ min: 1, max: 4 }),
        );
        for (let j = 0; j < monthsToPay; j++) {
          const paymentDate = new Date(customer.createdAt);
          paymentDate.setMonth(paymentDate.getMonth() + j);
          paymentDate.setDate(faker.number.int({ min: 10, max: 28 }));
          if (paymentDate > now) break;

          // Pay a partial amount sometimes
          const amount =
            Math.random() > 0.8
              ? customer.monthlyFee - faker.number.int({ min: 50, max: 100 })
              : customer.monthlyFee;

          totalPaid += amount;
          payments.push({
            customerId: customer._id,
            amount,
            paidMonth: paymentDate.getMonth() + 1,
            paidYear: paymentDate.getFullYear(),
            paymentDate,
            paymentMode: "Cash",
            createdAt: paymentDate,
          });
        }
      }
    }

    console.log("Inserting customers...");
    await Customer.insertMany(customers);

    console.log("Inserting payments...");
    await Payment.insertMany(payments);

    console.log("Inserting activity logs...");
    await ActivityLog.insertMany(activities);

    // Set the counters for serial numbers and receipts
    await Promise.all([
      Counter.findByIdAndUpdate(
        "customerSerialNumber",
        { seq: customers.length },
        { upsert: true },
      ),
      Counter.findByIdAndUpdate(
        "receiptNumber",
        { seq: payments.length },
        { upsert: true },
      ),
    ]);
    console.log(`Counter 'customerSerialNumber' set to ${customers.length}.`);
    console.log(`Counter 'receiptNumber' set to ${payments.length}.`);

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    mongoose.disconnect();
  }
}

seedDB();
