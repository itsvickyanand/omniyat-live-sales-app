// const express = require("express");
// const router = express.Router();

// const { Order } = require("../models");
// const { checkCcavenueStatus } = require("../services/ccavenueStatus.service");
// router.get("/check/:orderId", async (req, res) => {
//   const order = await Order.findByPk(req.params.orderId);

//   console.log("DB Order ID:", order.id);
//   console.log("Gateway Order ID:", order.gatewayOrderId);

//   const result = await checkCcavenueStatus(order);

//   res.json(result);
// });

// module.exports = router;

const express = require("express");
const router = express.Router();

const {
  fetchCcavenueTransactions,
} = require("../services/ccavenueFetchTransactions.service");

/*
TEST API

GET /api/debug/ccavenue-transactions?from=2026-02-10&to=2026-02-13
*/

router.get("/ccavenue-transactions", async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        message: "from and to required",
      });
    }

    const result = await fetchCcavenueTransactions(from, to);

    return res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;
