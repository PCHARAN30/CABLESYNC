const ActivityLog = require('../models/ActivityLog');

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function monthName(monthNumber) {
  return MONTH_NAMES[monthNumber - 1] || `Month ${monthNumber}`;
}

// Fire-and-log: never let a logging failure break the actual operation
// (payment/customer save) that triggered it. This is the single place
// that writes to ActivityLog - controllers call this, they never touch
// the model directly.
async function logActivity(customerId, action, message) {
  try {
    await ActivityLog.create({ customerId, action, message });
  } catch (err) {
    console.error('Failed to write activity log:', err.message);
  }
}

module.exports = { logActivity, monthName };
