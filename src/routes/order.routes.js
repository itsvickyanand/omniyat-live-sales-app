const express = require("express");
const {
  createOrder,
  getAllOrders,
  cancelOrder,
  markOrderPaid,
  getOrderDetail,
  deleteOrder,
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

router.get("/detail/:id", getOrderDetail);

router.delete("/delete/:id", deleteOrder);

module.exports = router;
