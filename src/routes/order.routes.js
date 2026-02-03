const express = require("express");
const {
  createOrder,
  getAllOrders,
  cancelOrder,
  markOrderPaid,
} = require("../controllers/order.controller");

const router = express.Router();

// ✅ Admin POS Order Create
router.post("/create", createOrder);

// ✅ List All Orders (Admin)
router.get("/all", getAllOrders);

// ✅ Cancel Order (restore stock)
router.put("/cancel/:id", cancelOrder);

// ✅ Mark Offline Order Paid
router.put("/mark-paid/:id", markOrderPaid);

module.exports = router;
