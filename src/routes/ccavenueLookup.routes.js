const express = require("express");
const {
  getPaymentHistory,
} = require("../controllers/ccavenueLookup.controller");

const router = express.Router();

router.get("/ccavenue/history", getPaymentHistory);

module.exports = router;
