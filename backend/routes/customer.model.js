const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    serialNumber: { type: String, required: true, unique: true, trim: true },
    cafNumber: { type: String, trim: true },
    address: { type: String, trim: true },
    area: { type: String, trim: true },
    monthlyFee: { type: Number, required: true, default: 0 },
    // --- BILLING FIELDS ---
    outstandingBalance: {
      type: Number,
      default: 0,
      description: "Total amount owed by the customer.",
    },
    validTill: {
      type: Date,
      description: "The date until which the customer's service is paid for.",
    },
    lastPaymentDate: {
      type: Date,
      description: "The date of the last successful payment.",
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Initialize validTill to connection date if it's a new customer
customerSchema.pre("save", function (next) {
  if (this.isNew && !this.validTill) {
    this.validTill = this.createdAt || new Date();
  }
  next();
});

module.exports = mongoose.model("Customer", customerSchema);
