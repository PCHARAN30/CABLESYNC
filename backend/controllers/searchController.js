const Customer = require('../models/Customer');

// GET /search?q=
// Matches name, phone, CAF, address, serial number, and PON.
// Uses a regex OR-query rather than $text so partial matches work
// (e.g. typing "987654" mid-phone-number returns a hit) - operators
// search with fragments, not full words.
async function searchCustomers(req, res) {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json([]);

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const customers = await Customer.find({
      isActive: true,
      $or: [
        { name: regex },
        { phone: regex },
        { cafNumber: regex },
        { address: regex },
        { serialNumber: regex },
        { pon: regex },
      ],
    }).limit(50);

    res.json(customers);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = { searchCustomers };
