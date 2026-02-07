// const express = require("express");
// const {
//   initiateCcavenuePayment,
//   ccavenueResponseHandler,
// } = require("../controllers/payment.controller");

// const router = express.Router();

// // ✅ Start CCAvenue payment for an order
// router.post("/ccavenue/initiate", initiateCcavenuePayment);

// // ✅ CCAvenue redirects here (POST)
// router.post("/ccavenue/response", ccavenueResponseHandler);

// module.exports = router;

// const express = require("express");
// const {
//   initiateCcavenuePayment,
//   ccavenueResponseHandler,
// } = require("../controllers/payment.controller");

// const router = express.Router();

// // Initiate payment
// router.post("/ccavenue/initiate", initiateCcavenuePayment);

// // FIXED response handler
// router.post(
//   "/ccavenue/response",
//   express.urlencoded({ extended: false }),
//   ccavenueResponseHandler
// );

// module.exports = router;

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
