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
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const customerValidationRules = [
  body("name").not().isEmpty().withMessage("Name is required").trim(),
  body("phone")
    .isMobilePhone("en-IN")
    .withMessage("Valid Indian phone number is required"),
  body("cafNumber")
    .not()
    .isEmpty()
    .withMessage("CAF Number is required")
    .trim(),
  body("monthlyFee")
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
