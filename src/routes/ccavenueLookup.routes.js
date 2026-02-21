const express = require("express");
const {
  getPaymentHistory,
  getSingleOrderStatus,
} = require("../controllers/ccavenueLookup.controller");

const router = express.Router();

router.get("/ccavenue/history", getPaymentHistory);
router.get("/ccavenue/order/:orderId", getSingleOrderStatus);

module.exports = router;
