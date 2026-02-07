const express = require("express");
const {
  mockInitiatePayment,
  mockSuccess,
  mockFail,
  mockCancel,
} = require("../controllers/mockPayment.controller");

const router = express.Router();

// ✅ Start mock payment (like ccavenue/initiate)
router.post("/initiate", mockInitiatePayment);

// ✅ simulate gateway redirect callbacks
router.get("/success", mockSuccess);
router.get("/fail", mockFail);
router.get("/cancel", mockCancel);

module.exports = router;
