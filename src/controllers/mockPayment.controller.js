const { Order, Product, sequelize } = require("../models");

const FRONTEND = process.env.FRONTEND_BASE_URL || "http://localhost:3001";

// ✅ This acts like initiate payment
// It returns a "paymentUrl" where user will be redirected
const mockInitiatePayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res
        .status(400)
        .json({ success: false, message: "orderId required" });
    }

    const order = await Order.findByPk(orderId);

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (order.status === "CANCELLED") {
      return res
        .status(400)
        .json({ success: false, message: "Order cancelled" });
    }

    if (order.paymentStatus === "PAID") {
      return res.status(400).json({ success: false, message: "Already paid" });
    }

    // ✅ send a fake gateway URL
    // User/admin can choose success/fail
    return res.json({
      success: true,
      orderId,
      paymentUrl: `http://localhost:3000/api/mock-payment/success?orderId=${orderId}`,
      failUrl: `http://localhost:3000/api/mock-payment/fail?orderId=${orderId}`,
      cancelUrl: `http://localhost:3000/api/mock-payment/cancel?orderId=${orderId}`,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Success callback
const mockSuccess = async (req, res) => {
  try {
    const { orderId } = req.query;

    const order = await Order.findByPk(orderId);

    if (!order) {
      return res.redirect(
        `${FRONTEND}/dashboard/payment-status?orderId=${orderId}&status=NOT_FOUND`
      );
    }

    if (order.status === "CANCELLED") {
      return res.redirect(
        `${FRONTEND}/dashboard/payment-status?orderId=${orderId}&status=CANCELLED`
      );
    }

    order.paymentMode = "ONLINE";
    order.paymentStatus = "PAID";
    order.gatewayTrackingId = "MOCK_TXN_" + Date.now();

    await order.save();

    return res.redirect(
      `${FRONTEND}/dashboard/payment-status?orderId=${orderId}&status=SUCCESS`
    );
  } catch (err) {
    return res.status(500).send(err.message);
  }
};

// ✅ Fail callback (restore stock)
const mockFail = async (req, res) => {
  try {
    const { orderId } = req.query;

    await sequelize.transaction(async (t) => {
      const order = await Order.findByPk(orderId, { transaction: t });

      if (!order) return;

      if (order.paymentStatus !== "PENDING") return;

      if (order.status === "CANCELLED") return;
      if (order.paymentStatus === "PAID") return;

      const product = await Product.findByPk(order.productId, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (product) {
        // product.stock += order.quantity;
        product.stock = 1;

        await product.save({ transaction: t });
      }

      order.paymentMode = "ONLINE";
      order.paymentStatus = "FAILED";
      await order.save({ transaction: t });
    });

    return res.redirect(
      `${FRONTEND}/dashboard/payment-status?orderId=${orderId}&status=FAILED`
    );
  } catch (err) {
    return res.status(500).send(err.message);
  }
};

// ✅ Cancel callback (restore stock)
const mockCancel = async (req, res) => {
  try {
    const { orderId } = req.query;

    await sequelize.transaction(async (t) => {
      const order = await Order.findByPk(orderId, { transaction: t });

      if (!order) return;
      if (order.paymentStatus !== "PENDING") return;
      if (order.status === "CANCELLED") return;
      if (order.paymentStatus === "PAID") return;

      const product = await Product.findByPk(order.productId, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (product) {
        // product.stock += order.quantity;
        product.stock = 1;

        await product.save({ transaction: t });
      }

      order.paymentMode = "ONLINE";
      order.paymentStatus = "FAILED";
      await order.save({ transaction: t });
    });

    return res.redirect(
      `${FRONTEND}/dashboard/payment-status?orderId=${orderId}&status=CANCELLED`
    );
  } catch (err) {
    return res.status(500).send(err.message);
  }
};

module.exports = {
  mockInitiatePayment,
  mockSuccess,
  mockFail,
  mockCancel,
};
