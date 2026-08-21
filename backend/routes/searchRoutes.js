const express = require('express');
const router = express.Router();
const { searchCustomers } = require('../controllers/searchController');

router.get('/', searchCustomers);

module.exports = router;
