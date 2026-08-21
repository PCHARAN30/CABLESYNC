const express = require("express");
const { body, validationResult } = require("express-validator");
const router = express.Router();
const {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  restoreCustomer,
  getDueStatus,
  getActivity,
  resetCustomers,
} = require("../controllers/customerController");

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array().map((e) => e.msg).join("; "),
      errors: errors.array(),
    });
  }
  next();
};

const customerValidationRules = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required"),

  // Accept the normal Indian 10-digit format and common +91 formatting.
  // The controller normalizes it before saving. This avoids the brittle
  // locale validator that was returning an unhelpful 400 on deployment.
  body("phone")
    .trim()
    .custom((value) => {
      const digits = String(value).replace(/\D/g, "");
      if (/^[6-9]\d{9}$/.test(digits) || /^91[6-9]\d{9}$/.test(digits)) {
        return true;
      }
      throw new Error("Valid Indian phone number is required");
    }),

  body("cafNumber")
    .trim()
    .notEmpty()
    .withMessage("CAF Number is required"),

  body("monthlyFee")
    .toFloat()
    .isFloat({ gt: 0 })
    .withMessage("Monthly fee must be a positive number"),
];

router.get("/", getCustomers);
router.post("/reset", resetCustomers);
router.get("/:id", getCustomerById);
router.get("/:id/due-status", getDueStatus);
router.get("/:id/activity", getActivity);

router.post("/", customerValidationRules, validateRequest, createCustomer);

router.put("/:id", customerValidationRules, validateRequest, updateCustomer);

router.delete("/:id", deleteCustomer);
router.patch("/:id/restore", restoreCustomer);

module.exports = router;
