const express = require("express");
const {
  initiateCcavenuePayment,
  ccavenueResponseHandler,
} = require("../controllers/payment.controller");

const router = express.Router();

// Initiate payment
router.post("/ccavenue/initiate", initiateCcavenuePayment);

// Use RAW parser for CCAvenue response
router.post(
  "/ccavenue/response",
  express.raw({ type: "*/*" }),
  ccavenueResponseHandler
);

module.exports = router;
