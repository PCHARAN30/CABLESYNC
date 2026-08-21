const mongoose = require('mongoose');

// Automatic audit trail. Never written to directly by an operator - only
// ever created by the backend itself when a payment or customer record
// changes, via utils/activityLog.js. This is what "auto system note"
// means here: the system narrates its own changes, the operator doesn't
// have to.
const activityLogSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: [
        'CUSTOMER_CREATED',
        'CUSTOMER_UPDATED',
        'CUSTOMER_DEACTIVATED',
        'CUSTOMER_RESTORED',
        'PAYMENT_ADDED',
        'PAYMENT_DELETED',
      ],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

activityLogSchema.index({ customerId: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
