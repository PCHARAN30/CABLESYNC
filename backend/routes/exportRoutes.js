const express = require("express");
const router = express.Router();
const { exportCustomersCSV } = require("../controllers/exportController");

// POST /export/csv - Generate a CSV of customers
router.post("/csv", exportCustomersCSV);

module.exports = router;
