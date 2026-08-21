const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    // Calendar fields are kept for reporting/history only. Billing itself is
    // calculated from paymentDate + the customer ledger.
    paidMonth: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    paidYear: {
      type: Number,
      required: true,
    },
    paymentDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    receiptNumber: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    paymentMode: {
      type: String,
      enum: ["Cash", "UPI", "Bank Transfer", "Other"],
      default: "Cash",
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    // Financial records are soft-deleted for auditability.
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  { timestamps: true },
);

paymentSchema.index({ customerId: 1, paymentDate: 1 });
paymentSchema.index({ customerId: 1, paidYear: 1, paidMonth: 1 });

module.exports = mongoose.model("Payment", paymentSchema);
