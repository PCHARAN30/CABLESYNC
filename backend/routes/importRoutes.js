const express = require("express");
const router = express.Router();
const {
  previewImport,
  executeImport,
} = require("../controllers/importController");

// POST /import/preview - Validate and check a CSV for duplicates
router.post("/preview", previewImport);

// POST /import/execute - Commit the validated records to the database
router.post("/execute", executeImport);

module.exports = router;
