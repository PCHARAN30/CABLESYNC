const express = require("express");
const router = express.Router();
const {
  createPayment,
  getPaymentsByCustomer,
  deletePayment,
  getTodaysCollection,
  previewPayment,
} = require("../controllers/paymentController");

router.post("/", createPayment);
router.get("/today", getTodaysCollection);
router.get("/customer/:id", getPaymentsByCustomer);
router.delete("/:id", deletePayment);
router.post("/preview", previewPayment);

module.exports = router;
