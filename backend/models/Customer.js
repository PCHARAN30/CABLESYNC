const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    serialNumber: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    cafNumber: {
      required: true,
      type: String,
      trim: true,
      unique: true,
      index: true,
    },
    address: {
      type: String,
      trim: true,
    },
    area: {
      type: String,
      trim: true,
      index: true,
    },
    pon: {
      type: String,
      trim: true,
    },
    monthlyFee: {
      type: Number,
      required: true,
      min: 0,
    },
    // Kept as a stored field for fast list/dashboard queries, but the
    // source of truth is computed from Payment records (see paymentController
    // due-logic notes). Recompute this whenever a payment is added/removed.
    status: {
      type: String,
      enum: ["PAID", "PARTIAL", "DUE", "INACTIVE"],
      default: "DUE",
    },
    // Soft-delete flag instead of hard delete - customers can be
    // disconnected without losing their payment history.
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }, // gives createdAt + updatedAt automatically
);

// Text index to support the /search endpoint across multiple fields
// Text index to support the /search endpoint across multiple fields
customerSchema.index({
  name: "text",
  phone: "text",
  cafNumber: "text",
  address: "text",
  pon: "text",
});

// Numeric/indexed serialNumber for exact lookups and sorting
customerSchema.index({ serialNumber: 1 });

module.exports = mongoose.model("Customer", customerSchema);
