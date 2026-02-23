const qs = require("querystring");
const { encrypt, decrypt } = require("../utils/ccavenue");
const { Order, product, sequelize } = require("../models");
const { v4: uuidv4 } = require("uuid");
const Product = require("../models/Product.model");

const FRONTEND_BASE = process.env.FRONTEND_BASE_URL || "http://localhost:3001";

/*
===========================================================
INITIATE PAYMENT
===========================================================
*/
const initiateCcavenuePayment = async (req, res) => {
  const reqId = uuidv4().slice(0, 8);
  let transaction;

  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "orderId is required",
      });
    }

    transaction = await sequelize.transaction();

    const order = await Order.findByPk(orderId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Prevent POS paid orders going online
    if (order.paymentMode === "OFFLINE" && order.paymentStatus === "PAID") {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Offline paid orders cannot be paid online",
      });
    }

    // Prevent duplicate initiation
    if (order.paymentMode === "ONLINE" && order.gatewayOrderId) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Payment already initiated",
      });
    }

    // Allow only PENDING
    if (order.paymentStatus !== "PENDING") {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Only pending orders can be paid",
      });
    }

    const {
      CCAV_MERCHANT_ID,
      CCAV_ACCESS_CODE,
      CCAV_WORKING_KEY,
      CCAV_REDIRECT_URL,
      CCAV_CANCEL_URL,
    } = process.env;

    if (!CCAV_MERCHANT_ID || !CCAV_ACCESS_CODE || !CCAV_WORKING_KEY) {
      await transaction.rollback();
      return res.status(500).json({
        success: false,
        message: "Gateway not configured",
      });
    }

    const shortOrderId = order.id.replace(/-/g, "").substring(0, 20);

    const rawData = {
      merchant_id: CCAV_MERCHANT_ID,
      order_id: shortOrderId,
      currency: "AED",
      amount: Number(order.amount).toFixed(2),
      redirect_url: CCAV_REDIRECT_URL,
      cancel_url: CCAV_CANCEL_URL,
      billing_name: order.customerFirstName + " " + order.customerLastName,
      billing_email: order.customerEmail,
      billing_tel: order.customerPhoneNumber,
      merchant_param1: order.id,
      language: "EN",
    };

    const encRequest = encrypt(qs.stringify(rawData), CCAV_WORKING_KEY);

    await order.update(
      {
        paymentMode: "ONLINE",
        paymentStatus: "PENDING",
        gatewayOrderId: shortOrderId,
      },
      { transaction }
    );

    await transaction.commit();

    return res.json({
      success: true,
      accessCode: CCAV_ACCESS_CODE,
      encRequest,
      orderId: order.id,
    });
  } catch (err) {
    if (transaction) await transaction.rollback();

    return res.status(500).json({
      success: false,
      message: "Payment initiation failed",
    });
  }
};

/*
===========================================================
CCAvenue RESPONSE HANDLER
===========================================================
*/

// const ccavenueResponseHandler = async (req, res) => {
//   const reqId = uuidv4().slice(0, 8);

//   console.log(`\n==============================`);
//   console.log(`🟣 [${reqId}] PAYMENT RESPONSE START`);
//   console.log(`==============================`);

//   let transaction;

//   try {
//     const rawBody = req.body.toString();
//     const parsedBody = qs.parse(rawBody);
//     const encResp = parsedBody.encResp;

//     if (!encResp) throw new Error("encResp missing");

//     const decrypted = decrypt(encResp, process.env.CCAV_WORKING_KEY);
//     const parsed = qs.parse(decrypted);

//     console.log(`[${reqId}] 🔎 Gateway order_status:`, parsed.order_status);
//     console.log(`[${reqId}] 🔎 tracking_id:`, parsed.tracking_id);
//     console.log(`[${reqId}] 🔎 merchant_param1:`, parsed.merchant_param1);

//     const orderId = parsed.merchant_param1;
//     if (!orderId) throw new Error("merchant_param1 missing");

//     transaction = await sequelize.transaction();
//     console.log(`[${reqId}] 🔐 Transaction started`);

//     const order = await Order.findByPk(orderId, {
//       transaction,
//       lock: transaction.LOCK.UPDATE,
//     });

//     if (!order) throw new Error("Order not found");

//     console.log(`[${reqId}] 📦 Order before update:`, {
//       id: order.id,
//       productId: order.productId,
//       quantity: order.quantity,
//       paymentStatus: order.paymentStatus,
//     });

//     // Idempotency check
//     if (["PAID", "FAILED", "CANCELLED"].includes(order.paymentStatus)) {
//       console.log(`[${reqId}] ⚠️ Already processed →`, order.paymentStatus);
//       await transaction.commit();
//       return res.redirect(
//         `${FRONTEND_BASE}/dashboard/payment-status?orderId=${orderId}&status=${order.paymentStatus}`
//       );
//     }

//     let finalStatus = "FAILED";

//     switch (parsed.order_status) {
//       case "Success":
//       case "Successful":
//         finalStatus = "PAID";
//         break;
//       case "Aborted":
//       case "Cancelled":
//         finalStatus = "CANCELLED";
//         break;
//       case "Failure":
//       case "Unsuccessful":
//         finalStatus = "FAILED";
//         break;
//     }

//     console.log(`[${reqId}] ✅ Final status resolved →`, finalStatus);

//     const mapPaymentMethod = (mode) => {
//       if (!mode) return "OTHER";

//       const m = mode.toLowerCase();

//       if (m.includes("upi")) return "UPI";
//       if (m.includes("card")) return "CARD";
//       if (m.includes("credit")) return "CARD";
//       if (m.includes("debit")) return "CARD";
//       if (m.includes("net")) return "NETBANKING";
//       if (m.includes("wallet")) return "WALLET";

//       return "OTHER";
//     };
//     console.log(
//       `[${reqId}] Saving paymentMethod:`,
//       mapPaymentMethod(parsed.payment_mode)
//     );
//     await order.update(
//       {
//         paymentStatus: finalStatus,
//         paymentMethod: mapPaymentMethod(parsed.payment_mode),
//         gatewayTrackingId: parsed.tracking_id || null,
//         paymentResponseRaw: JSON.stringify(parsed),
//       },
//       { transaction }
//     );

//     console.log(`[${reqId}] 📝 Order updated to →`, finalStatus);

//     const product = await Product.findByPk(order.productId, {
//       transaction,
//       lock: transaction.LOCK.UPDATE,
//     });

//     if (!product) throw new Error("Product not found");

//     console.log(`[${reqId}] 📊 Product stock BEFORE logic:`, product.stock);

//     if (finalStatus !== "PAID") {
//       console.log(`[${reqId}] 🔄 Restoring stock...`);

//       await product.increment({ stock: order.quantity }, { transaction });

//       await product.reload({ transaction });

//       console.log(`[${reqId}] 📊 Product stock AFTER restore:`, product.stock);
//     } else {
//       console.log(
//         `[${reqId}] 🟢 Payment successful — NO stock restore (expected)`
//       );
//     }

//     await transaction.commit();
//     console.log(`[${reqId}] 💾 Transaction committed`);

//     return res.redirect(
//       `${FRONTEND_BASE}/dashboard/payment-status?orderId=${orderId}&status=${finalStatus}`
//     );
//   } catch (err) {
//     console.error(`🔴 [${reqId}] ERROR →`, err.message);

//     if (transaction) {
//       await transaction.rollback();
//       console.log(`[${reqId}] ❌ Transaction rolled back`);
//     }

//     return res.redirect(
//       `${FRONTEND_BASE}/dashboard/payment-status?status=ERROR`
//     );
//   }
// };
const ccavenueResponseHandler = async (req, res) => {
  const reqId = uuidv4().slice(0, 8);
  let transaction;

  console.log(`\n==============================`);
  console.log(`🟣 [${reqId}] PAYMENT RESPONSE START`);
  console.log(`==============================`);

  try {
    // 🔍 Step 1: Log Request Metadata
    console.log(`[${reqId}] 🔹 METHOD:`, req.method);
    console.log(`[${reqId}] 🔹 HEADERS:`, JSON.stringify(req.headers, null, 2));
    console.log(`[${reqId}] 🔹 CONTENT-TYPE:`, req.headers["content-type"]);

    // 🔍 Step 2: Log Raw Body
    const rawBody = req.body.toString();
    console.log(`[${reqId}] 🔹 RAW BODY:`, rawBody);

    const parsedBody = qs.parse(rawBody);
    console.log(`[${reqId}] 🔹 PARSED BODY:`, parsedBody);

    const encResp = parsedBody.encResp;
    if (!encResp) throw new Error("encResp missing");

    console.log(`[${reqId}] 🔐 encResp length:`, encResp.length);

    // 🔓 Step 3: Decrypt
    const decrypted = decrypt(encResp, process.env.CCAV_WORKING_KEY);
    console.log(`[${reqId}] 🔓 DECRYPTED STRING:`, decrypted);

    const parsed = qs.parse(decrypted);
    console.log(`[${reqId}] 🔓 DECRYPTED PARSED OBJECT:`, parsed);

    // 🔎 Log all important gateway fields
    console.log(`[${reqId}] 🔎 order_status:`, parsed.order_status);
    console.log(`[${reqId}] 🔎 tracking_id:`, parsed.tracking_id);
    console.log(`[${reqId}] 🔎 bank_ref_no:`, parsed.bank_ref_no);
    console.log(`[${reqId}] 🔎 payment_mode:`, parsed.payment_mode);
    console.log(`[${reqId}] 🔎 merchant_param1:`, parsed.merchant_param1);
    console.log(`[${reqId}] 🔎 amount:`, parsed.amount);
    console.log(`[${reqId}] 🔎 currency:`, parsed.currency);

    const orderId = parsed.merchant_param1;
    if (!orderId) throw new Error("merchant_param1 missing");

    // 🔐 Start DB Transaction
    transaction = await sequelize.transaction();
    console.log(`[${reqId}] 🔐 DB transaction started`);

    const order = await Order.findByPk(orderId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!order) throw new Error("Order not found");

    console.log(`[${reqId}] 📦 ORDER BEFORE UPDATE:`, order.toJSON());

    // Idempotency check
    if (["PAID", "FAILED", "CANCELLED"].includes(order.paymentStatus)) {
      console.log(`[${reqId}] ⚠️ Already processed →`, order.paymentStatus);

      await transaction.commit();

      const redirectUrl = `${FRONTEND_BASE}/dashboard/payment-status?orderId=${orderId}&status=${order.paymentStatus}`;
      console.log(`[${reqId}] 🔁 REDIRECT URL (idempotent):`, redirectUrl);

      return res.redirect(redirectUrl);
    }

    // Resolve final status
    let finalStatus = "FAILED";

    switch (parsed.order_status) {
      case "Success":
      case "Successful":
        finalStatus = "PAID";
        break;
      case "Aborted":
      case "Cancelled":
        finalStatus = "CANCELLED";
        break;
      case "Failure":
      case "Unsuccessful":
        finalStatus = "FAILED";
        break;
    }

    console.log(`[${reqId}] ✅ Final status resolved →`, finalStatus);

    const mapPaymentMethod = (mode) => {
      if (!mode) return "OTHER";
      const m = mode.toLowerCase();
      if (m.includes("upi")) return "UPI";
      if (m.includes("card")) return "CARD";
      if (m.includes("credit")) return "CARD";
      if (m.includes("debit")) return "CARD";
      if (m.includes("net")) return "NETBANKING";
      if (m.includes("wallet")) return "WALLET";
      return "OTHER";
    };

    const paymentMethod = mapPaymentMethod(parsed.payment_mode);
    console.log(`[${reqId}] 💳 Payment method resolved:`, paymentMethod);

    await order.update(
      {
        paymentStatus: finalStatus,
        paymentMethod,
        gatewayTrackingId: parsed.tracking_id || null,
        paymentResponseRaw: JSON.stringify(parsed),
      },
      { transaction }
    );

    console.log(`[${reqId}] 📝 Order updated`);

    const product = await Product.findByPk(order.productId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!product) throw new Error("Product not found");

    console.log(`[${reqId}] 📊 Product stock BEFORE:`, product.stock);

    if (finalStatus !== "PAID") {
      console.log(`[${reqId}] 🔄 Restoring stock...`);
      await product.increment({ stock: order.quantity }, { transaction });
      await product.reload({ transaction });
      console.log(`[${reqId}] 📊 Product stock AFTER restore:`, product.stock);
    } else {
      console.log(`[${reqId}] 🟢 Payment success — stock unchanged`);
    }

    await transaction.commit();
    console.log(`[${reqId}] 💾 Transaction committed`);

    const redirectUrl = `${FRONTEND_BASE}/dashboard/payment-status?orderId=${orderId}&status=${finalStatus}`;
    console.log(`[${reqId}] 🚀 FINAL REDIRECT URL:`, redirectUrl);

    console.log(`==============================`);
    console.log(`🟣 [${reqId}] PAYMENT RESPONSE END`);
    console.log(`==============================\n`);

    return res.redirect(redirectUrl);
  } catch (err) {
    console.error(`🔴 [${reqId}] ERROR →`, err);

    if (transaction) {
      await transaction.rollback();
      console.log(`[${reqId}] ❌ Transaction rolled back`);
    }

    const errorRedirect = `${FRONTEND_BASE}/dashboard/payment-status?status=ERROR`;
    console.log(`[${reqId}] 🚨 ERROR REDIRECT URL:`, errorRedirect);

    return res.redirect(errorRedirect);
  }
};

module.exports = {
  initiateCcavenuePayment,
  ccavenueResponseHandler,
};
