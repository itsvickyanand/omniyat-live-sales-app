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

// const initiateCcavenuePayment = async (req, res) => {
//   const reqId = uuidv4().slice(0, 8);

//   console.log(`\n🟢 [${reqId}] INITIATE PAYMENT START`);

//   try {
//     const { orderId } = req.body;

//     if (!orderId) {
//       return res.status(400).json({
//         success: false,
//         message: "orderId is required",
//       });
//     }

//     const order = await Order.findByPk(orderId);

//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: "Order not found",
//       });
//     }
//     if (order.paymentMode === "OFFLINE" && order.paymentStatus === "PAID") {
//       return res.status(400).json({
//         success: false,
//         message: "Offline paid orders cannot be paid online",
//       });
//     }
//     if (order.paymentStatus !== "PENDING") {
//       return res.status(400).json({
//         success: false,
//         message: "Only pending orders can be paid",
//       });
//     }

//     /*
//     Prevent duplicate payment attempts
//     */
//     if (order.paymentStatus === "PAID") {
//       return res.status(400).json({
//         success: false,
//         message: "Order already paid",
//       });
//     }

//     /*
//     Validate environment
//     */
//     const {
//       CCAV_MERCHANT_ID,
//       CCAV_ACCESS_CODE,
//       CCAV_WORKING_KEY,
//       CCAV_REDIRECT_URL,
//       CCAV_CANCEL_URL,
//     } = process.env;

//     if (
//       !CCAV_MERCHANT_ID ||
//       !CCAV_ACCESS_CODE ||
//       !CCAV_WORKING_KEY ||
//       !CCAV_REDIRECT_URL ||
//       !CCAV_CANCEL_URL
//     ) {
//       console.error(`[${reqId}] Missing gateway env config`);

//       return res.status(500).json({
//         success: false,
//         message: "Payment gateway not configured",
//       });
//     }

//     /*
//     Generate short ID (CCAvenue limit)
//     */
//     const shortOrderId = order.id.replace(/-/g, "").substring(0, 20);

//     /*
//     Prepare gateway payload
//     */
//     const rawData = {
//       merchant_id: CCAV_MERCHANT_ID,
//       order_id: shortOrderId,

//       currency: "AED",
//       amount: Number(order.amount).toFixed(2),

//       redirect_url: CCAV_REDIRECT_URL,
//       cancel_url: CCAV_CANCEL_URL,

//       billing_name: order.customerName,
//       billing_email: order.customerEmail,
//       billing_tel: order.customerPhone,

//       billing_address: "NA",
//       billing_city: "NA",
//       billing_state: "NA",
//       billing_zip: "00000",
//       billing_country: "AE",

//       /*
//       Critical mapping fields
//       */
//       merchant_param1: order.id,
//       merchant_param2: order.customerEmail || "",
//       merchant_param3: order.customerPhone || "",

//       language: "EN",
//     };

//     const rawString = qs.stringify(rawData);

//     const encRequest = encrypt(rawString, CCAV_WORKING_KEY);

//     /*
//     Update order safely
//     */
//     await order.update({
//       paymentMode: "ONLINE",
//       paymentStatus: "PENDING",
//       gatewayOrderId: shortOrderId,
//     });

//     console.log(`🟢 [${reqId}] INITIATE SUCCESS`);

//     return res.json({
//       success: true,
//       accessCode: CCAV_ACCESS_CODE,
//       encRequest,
//       orderId: order.id,
//     });
//   } catch (err) {
//     console.error(`🔴 [${reqId}] INITIATE ERROR`, err);

//     return res.status(500).json({
//       success: false,
//       message: "Payment initiation failed",
//     });
//   }
// };

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
//     console.log(`[${reqId}] Step 1: Reading raw body`);

//     const rawBody = req.body.toString();
//     console.log(`[${reqId}] Raw body length:`, rawBody.length);

//     const parsedBody = qs.parse(rawBody);
//     console.log(`[${reqId}] Parsed body keys:`, Object.keys(parsedBody));

//     const encResp = parsedBody.encResp;

//     if (!encResp) {
//       console.log(`[${reqId}] ❌ encResp missing`);
//       throw new Error("encResp missing");
//     }

//     console.log(`[${reqId}] Step 2: Decrypting response`);

//     const decrypted = decrypt(encResp, process.env.CCAV_WORKING_KEY);
//     console.log(`[${reqId}] Decrypted string length:`, decrypted.length);

//     const parsed = qs.parse(decrypted);

//     console.log(`[${reqId}] Gateway response parsed:`);
//     console.log(parsed);

//     const orderId = parsed.merchant_param1;

//     console.log(`[${reqId}] Step 3: OrderId extracted:`, orderId);

//     if (!orderId) {
//       throw new Error("merchant_param1 missing");
//     }

//     /*
//     Start transaction
//     */
//     console.log(`[${reqId}] Step 4: Starting DB transaction`);

//     transaction = await sequelize.transaction();

//     console.log(`[${reqId}] Transaction started`);

//     /*
//     Lock order
//     */
//     console.log(`[${reqId}] Step 5: Fetching order`);

//     const order = await Order.findByPk(orderId, {
//       transaction,
//       lock: transaction.LOCK.UPDATE,
//     });

//     if (!order) {
//       throw new Error("Order not found");
//     }

//     console.log(`[${reqId}] Order found`, {
//       id: order.id,
//       productId: order.productId,
//       quantity: order.quantity,
//       paymentStatus: order.paymentStatus,
//     });

//     /*
//     Idempotency protection
//     */
//     if (
//       order.paymentStatus === "PAID" ||
//       order.paymentStatus === "FAILED" ||
//       order.paymentStatus === "CANCELLED"
//     ) {
//       console.log(`[${reqId}] Already processed`);

//       await transaction.commit();

//       return res.redirect(
//         `${FRONTEND_BASE}/dashboard/payment-status?orderId=${orderId}&status=${order.paymentStatus}`
//       );
//     }

//     /*
//     Determine final status
//     */
//     console.log(`[${reqId}] Step 6: Determining payment status`);

//     let finalStatus = "FAILED";

//     switch (parsed.order_status) {
//       case "Success":
//         finalStatus = "PAID";
//         break;

//       case "Aborted":
//         finalStatus = "CANCELLED";
//         break;

//       case "Failure":
//         finalStatus = "FAILED";
//         break;
//     }

//     console.log(`[${reqId}] Final status:`, finalStatus);

//     /*
//     Proper payment method mapping
//     */
//     const mapPaymentMethod = (mode) => {
//       if (!mode || mode === "null") return "OTHER";

//       const m = mode.toLowerCase();

//       if (m.includes("upi")) return "UPI";

//       if (m.includes("card") || m.includes("credit") || m.includes("debit"))
//         return "CARD";

//       if (m.includes("cash")) return "CASH";

//       return "OTHER";
//     };

//     /*
//     Update order
//     */
//     console.log(`[${reqId}] Step 7: Updating order`);

//     await order.update(
//       {
//         paymentStatus: finalStatus,
//         paymentMethod: mapPaymentMethod(parsed.payment_mode),
//         gatewayTrackingId:
//           parsed.tracking_id && parsed.tracking_id !== "null"
//             ? parsed.tracking_id
//             : null,
//         paymentResponseRaw: JSON.stringify(parsed),
//       },
//       { transaction }
//     );

//     console.log(`[${reqId}] Order updated`);

//     /*
//     Restore stock if NOT paid
//     */
//     if (finalStatus !== "PAID") {
//       console.log(`[${reqId}] Step 8: Restoring stock`);

//       const product = await Product.findByPk(order.productId, {
//         transaction,
//         lock: transaction.LOCK.UPDATE,
//       });

//       if (!product) {
//         throw new Error("Product not found");
//       }

//       console.log(`[${reqId}] Current stock:`, product.stock);

//       await product.increment({ stock: order.quantity }, { transaction });

//       await product.reload({ transaction });

//       console.log(`[${reqId}] Stock restored →`, product.stock);
//     }

//     /*
//     Commit
//     */
//     console.log(`[${reqId}] Step 9: Commit`);

//     await transaction.commit();

//     console.log(`[${reqId}] SUCCESS`);

//     return res.redirect(
//       `${FRONTEND_BASE}/dashboard/payment-status?orderId=${orderId}&status=${finalStatus}`
//     );
//   } catch (err) {
//     console.error(`🔴 [${reqId}] ERROR`, err);

//     if (transaction) {
//       await transaction.rollback();
//       console.log(`[${reqId}] Transaction rolled back`);
//     }

//     return res.redirect(
//       `${FRONTEND_BASE}/dashboard/payment-status?status=ERROR`
//     );
//   }
// };
const ccavenueResponseHandler = async (req, res) => {
  const reqId = uuidv4().slice(0, 8);

  console.log(`\n==============================`);
  console.log(`🟣 [${reqId}] PAYMENT RESPONSE START`);
  console.log(`==============================`);

  let transaction;

  try {
    const rawBody = req.body.toString();
    const parsedBody = qs.parse(rawBody);
    const encResp = parsedBody.encResp;

    if (!encResp) throw new Error("encResp missing");

    const decrypted = decrypt(encResp, process.env.CCAV_WORKING_KEY);
    const parsed = qs.parse(decrypted);

    console.log(`[${reqId}] 🔎 Gateway order_status:`, parsed.order_status);
    console.log(`[${reqId}] 🔎 tracking_id:`, parsed.tracking_id);
    console.log(`[${reqId}] 🔎 merchant_param1:`, parsed.merchant_param1);

    const orderId = parsed.merchant_param1;
    if (!orderId) throw new Error("merchant_param1 missing");

    transaction = await sequelize.transaction();
    console.log(`[${reqId}] 🔐 Transaction started`);

    const order = await Order.findByPk(orderId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!order) throw new Error("Order not found");

    console.log(`[${reqId}] 📦 Order before update:`, {
      id: order.id,
      productId: order.productId,
      quantity: order.quantity,
      paymentStatus: order.paymentStatus,
    });

    // Idempotency check
    if (["PAID", "FAILED", "CANCELLED"].includes(order.paymentStatus)) {
      console.log(`[${reqId}] ⚠️ Already processed →`, order.paymentStatus);
      await transaction.commit();
      return res.redirect(
        `${FRONTEND_BASE}/dashboard/payment-status?orderId=${orderId}&status=${order.paymentStatus}`
      );
    }

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
    console.log(
      `[${reqId}] Saving paymentMethod:`,
      mapPaymentMethod(parsed.payment_mode)
    );
    await order.update(
      {
        paymentStatus: finalStatus,
        paymentMethod: mapPaymentMethod(parsed.payment_mode),
        gatewayTrackingId: parsed.tracking_id || null,
        paymentResponseRaw: JSON.stringify(parsed),
      },
      { transaction }
    );

    console.log(`[${reqId}] 📝 Order updated to →`, finalStatus);

    const product = await Product.findByPk(order.productId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!product) throw new Error("Product not found");

    console.log(`[${reqId}] 📊 Product stock BEFORE logic:`, product.stock);

    if (finalStatus !== "PAID") {
      console.log(`[${reqId}] 🔄 Restoring stock...`);

      await product.increment({ stock: order.quantity }, { transaction });

      await product.reload({ transaction });

      console.log(`[${reqId}] 📊 Product stock AFTER restore:`, product.stock);
    } else {
      console.log(
        `[${reqId}] 🟢 Payment successful — NO stock restore (expected)`
      );
    }

    await transaction.commit();
    console.log(`[${reqId}] 💾 Transaction committed`);

    return res.redirect(
      `${FRONTEND_BASE}/dashboard/payment-status?orderId=${orderId}&status=${finalStatus}`
    );
  } catch (err) {
    console.error(`🔴 [${reqId}] ERROR →`, err.message);

    if (transaction) {
      await transaction.rollback();
      console.log(`[${reqId}] ❌ Transaction rolled back`);
    }

    return res.redirect(
      `${FRONTEND_BASE}/dashboard/payment-status?status=ERROR`
    );
  }
};

module.exports = {
  initiateCcavenuePayment,
  ccavenueResponseHandler,
};

// const qs = require("querystring");
// const { encrypt, decrypt } = require("../utils/ccavenue");
// const { Order, product, sequelize } = require("../models");
// const { v4: uuidv4 } = require("uuid");
// const Product = require("../models/Product.model");
// const {
//   fetchSingleOrderFromCCA,
// } = require("../services/ccavenueFetchTransactions.service");

// const FRONTEND_BASE = process.env.FRONTEND_BASE_URL || "http://localhost:3001";

// /*
// ===========================================================
// INITIATE PAYMENT
// ===========================================================
// */
// const initiateCcavenuePayment = async (req, res) => {
//   const reqId = uuidv4().slice(0, 8);
//   let transaction;

//   try {
//     const { orderId } = req.body;

//     if (!orderId) {
//       return res.status(400).json({
//         success: false,
//         message: "orderId is required",
//       });
//     }

//     transaction = await sequelize.transaction();

//     const order = await Order.findByPk(orderId, {
//       transaction,
//       lock: transaction.LOCK.UPDATE,
//     });

//     if (!order) {
//       await transaction.rollback();
//       return res.status(404).json({
//         success: false,
//         message: "Order not found",
//       });
//     }

//     /*
//     =====================================
//     STRICT INITIATION CONDITIONS
//     =====================================
//     */

//     if (order.paymentStatus !== "PENDING") {
//       await transaction.rollback();
//       return res.status(400).json({
//         success: false,
//         message: "Only pending orders can be paid",
//       });
//     }

//     if (order.gatewayOrderId) {
//       await transaction.rollback();
//       return res.status(400).json({
//         success: false,
//         message: "Payment already initiated",
//       });
//     }

//     /*
//     =====================================
//     Gateway config validation
//     =====================================
//     */

//     const {
//       CCAV_MERCHANT_ID,
//       CCAV_ACCESS_CODE,
//       CCAV_WORKING_KEY,
//       CCAV_REDIRECT_URL,
//       CCAV_CANCEL_URL,
//     } = process.env;

//     if (
//       !CCAV_MERCHANT_ID ||
//       !CCAV_ACCESS_CODE ||
//       !CCAV_WORKING_KEY ||
//       !CCAV_REDIRECT_URL ||
//       !CCAV_CANCEL_URL
//     ) {
//       await transaction.rollback();
//       return res.status(500).json({
//         success: false,
//         message: "Gateway not configured",
//       });
//     }

//     /*
//     =====================================
//     Generate short gateway ID
//     =====================================
//     */

//     const shortOrderId = order.id.replace(/-/g, "").substring(0, 20);

//     /*
//     Immediately store gatewayOrderId
//     So second parallel request fails
//     */

//     await order.update(
//       {
//         paymentMode: "ONLINE",
//         gatewayOrderId: shortOrderId,
//       },
//       { transaction }
//     );

//     await transaction.commit();

//     /*
//     =====================================
//     Build gateway payload AFTER commit
//     =====================================
//     */

//     const rawData = {
//       merchant_id: CCAV_MERCHANT_ID,
//       order_id: shortOrderId,
//       currency: "AED",
//       amount: Number(order.amount).toFixed(2),
//       redirect_url: CCAV_REDIRECT_URL,
//       cancel_url: CCAV_CANCEL_URL,
//       billing_name:
//         order.customerFirstName + " " + (order.customerLastName || ""),
//       billing_email: order.customerEmail,
//       billing_tel: order.customerPhoneNumber,
//       merchant_param1: order.id,
//       language: "EN",
//     };

//     const encRequest = encrypt(qs.stringify(rawData), CCAV_WORKING_KEY);

//     return res.json({
//       success: true,
//       accessCode: CCAV_ACCESS_CODE,
//       encRequest,
//       orderId: order.id,
//     });
//   } catch (err) {
//     if (transaction) await transaction.rollback();

//     console.error(`[${reqId}] INIT ERROR →`, err.message);

//     return res.status(500).json({
//       success: false,
//       message: "Payment initiation failed",
//     });
//   }
// };
// // const initiateCcavenuePayment = async (req, res) => {
// //   const reqId = uuidv4().slice(0, 8);
// //   let transaction;

// //   try {
// //     const { orderId } = req.body;

// //     if (!orderId) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "orderId is required",
// //       });
// //     }

// //     transaction = await sequelize.transaction();

// //     const order = await Order.findByPk(orderId, {
// //       transaction,
// //       lock: transaction.LOCK.UPDATE,
// //     });

// //     if (!order) {
// //       await transaction.rollback();
// //       return res.status(404).json({
// //         success: false,
// //         message: "Order not found",
// //       });
// //     }

// //     // Prevent POS paid orders going online
// //     if (order.paymentMode === "OFFLINE" && order.paymentStatus === "PAID") {
// //       await transaction.rollback();
// //       return res.status(400).json({
// //         success: false,
// //         message: "Offline paid orders cannot be paid online",
// //       });
// //     }

// //     // Prevent duplicate initiation
// //     if (order.paymentMode === "ONLINE" && order.gatewayOrderId) {
// //       await transaction.rollback();
// //       return res.status(400).json({
// //         success: false,
// //         message: "Payment already initiated",
// //       });
// //     }

// //     // Allow only PENDING
// //     if (order.paymentStatus !== "PENDING") {
// //       await transaction.rollback();
// //       return res.status(400).json({
// //         success: false,
// //         message: "Only pending orders can be paid",
// //       });
// //     }

// //     const {
// //       CCAV_MERCHANT_ID,
// //       CCAV_ACCESS_CODE,
// //       CCAV_WORKING_KEY,
// //       CCAV_REDIRECT_URL,
// //       CCAV_CANCEL_URL,
// //     } = process.env;

// //     if (!CCAV_MERCHANT_ID || !CCAV_ACCESS_CODE || !CCAV_WORKING_KEY) {
// //       await transaction.rollback();
// //       return res.status(500).json({
// //         success: false,
// //         message: "Gateway not configured",
// //       });
// //     }

// //     const shortOrderId = order.id.replace(/-/g, "").substring(0, 20);

// //     const rawData = {
// //       merchant_id: CCAV_MERCHANT_ID,
// //       order_id: shortOrderId,
// //       currency: "AED",
// //       amount: Number(order.amount).toFixed(2),
// //       redirect_url: CCAV_REDIRECT_URL,
// //       cancel_url: CCAV_CANCEL_URL,
// //       billing_name: order.customerFirstName + " " + order.customerLastName,
// //       billing_email: order.customerEmail,
// //       billing_tel: order.customerPhoneNumber,
// //       merchant_param1: order.id,
// //       language: "EN",
// //     };

// //     const encRequest = encrypt(qs.stringify(rawData), CCAV_WORKING_KEY);

// //     await order.update(
// //       {
// //         paymentMode: "ONLINE",
// //         paymentStatus: "PENDING",
// //         gatewayOrderId: shortOrderId,
// //       },
// //       { transaction }
// //     );

// //     await transaction.commit();

// //     return res.json({
// //       success: true,
// //       accessCode: CCAV_ACCESS_CODE,
// //       encRequest,
// //       orderId: order.id,
// //     });
// //   } catch (err) {
// //     if (transaction) await transaction.rollback();

// //     return res.status(500).json({
// //       success: false,
// //       message: "Payment initiation failed",
// //     });
// //   }
// // };

// // const initiateCcavenuePayment = async (req, res) => {
// //   const reqId = uuidv4().slice(0, 8);

// //   console.log(`\n🟢 [${reqId}] INITIATE PAYMENT START`);

// //   try {
// //     const { orderId } = req.body;

// //     if (!orderId) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "orderId is required",
// //       });
// //     }

// //     const order = await Order.findByPk(orderId);

// //     if (!order) {
// //       return res.status(404).json({
// //         success: false,
// //         message: "Order not found",
// //       });
// //     }
// //     if (order.paymentMode === "OFFLINE" && order.paymentStatus === "PAID") {
// //       return res.status(400).json({
// //         success: false,
// //         message: "Offline paid orders cannot be paid online",
// //       });
// //     }
// //     if (order.paymentStatus !== "PENDING") {
// //       return res.status(400).json({
// //         success: false,
// //         message: "Only pending orders can be paid",
// //       });
// //     }

// //     /*
// //     Prevent duplicate payment attempts
// //     */
// //     if (order.paymentStatus === "PAID") {
// //       return res.status(400).json({
// //         success: false,
// //         message: "Order already paid",
// //       });
// //     }

// //     /*
// //     Validate environment
// //     */
// //     const {
// //       CCAV_MERCHANT_ID,
// //       CCAV_ACCESS_CODE,
// //       CCAV_WORKING_KEY,
// //       CCAV_REDIRECT_URL,
// //       CCAV_CANCEL_URL,
// //     } = process.env;

// //     if (
// //       !CCAV_MERCHANT_ID ||
// //       !CCAV_ACCESS_CODE ||
// //       !CCAV_WORKING_KEY ||
// //       !CCAV_REDIRECT_URL ||
// //       !CCAV_CANCEL_URL
// //     ) {
// //       console.error(`[${reqId}] Missing gateway env config`);

// //       return res.status(500).json({
// //         success: false,
// //         message: "Payment gateway not configured",
// //       });
// //     }

// //     /*
// //     Generate short ID (CCAvenue limit)
// //     */
// //     const shortOrderId = order.id.replace(/-/g, "").substring(0, 20);

// //     /*
// //     Prepare gateway payload
// //     */
// //     const rawData = {
// //       merchant_id: CCAV_MERCHANT_ID,
// //       order_id: shortOrderId,

// //       currency: "AED",
// //       amount: Number(order.amount).toFixed(2),

// //       redirect_url: CCAV_REDIRECT_URL,
// //       cancel_url: CCAV_CANCEL_URL,

// //       billing_name: order.customerName,
// //       billing_email: order.customerEmail,
// //       billing_tel: order.customerPhone,

// //       billing_address: "NA",
// //       billing_city: "NA",
// //       billing_state: "NA",
// //       billing_zip: "00000",
// //       billing_country: "AE",

// //       /*
// //       Critical mapping fields
// //       */
// //       merchant_param1: order.id,
// //       merchant_param2: order.customerEmail || "",
// //       merchant_param3: order.customerPhone || "",

// //       language: "EN",
// //     };

// //     const rawString = qs.stringify(rawData);

// //     const encRequest = encrypt(rawString, CCAV_WORKING_KEY);

// //     /*
// //     Update order safely
// //     */
// //     await order.update({
// //       paymentMode: "ONLINE",
// //       paymentStatus: "PENDING",
// //       gatewayOrderId: shortOrderId,
// //     });

// //     console.log(`🟢 [${reqId}] INITIATE SUCCESS`);

// //     return res.json({
// //       success: true,
// //       accessCode: CCAV_ACCESS_CODE,
// //       encRequest,
// //       orderId: order.id,
// //     });
// //   } catch (err) {
// //     console.error(`🔴 [${reqId}] INITIATE ERROR`, err);

// //     return res.status(500).json({
// //       success: false,
// //       message: "Payment initiation failed",
// //     });
// //   }
// // };

// /*
// ===========================================================
// CCAvenue RESPONSE HANDLER
// ===========================================================
// */

// // const ccavenueResponseHandler = async (req, res) => {
// //   const reqId = uuidv4().slice(0, 8);

// //   console.log(`\n==============================`);
// //   console.log(`🟣 [${reqId}] PAYMENT RESPONSE START`);
// //   console.log(`==============================`);

// //   let transaction;

// //   try {
// //     console.log(`[${reqId}] Step 1: Reading raw body`);

// //     const rawBody = req.body.toString();
// //     console.log(`[${reqId}] Raw body length:`, rawBody.length);

// //     const parsedBody = qs.parse(rawBody);
// //     console.log(`[${reqId}] Parsed body keys:`, Object.keys(parsedBody));

// //     const encResp = parsedBody.encResp;

// //     if (!encResp) {
// //       console.log(`[${reqId}] ❌ encResp missing`);
// //       throw new Error("encResp missing");
// //     }

// //     console.log(`[${reqId}] Step 2: Decrypting response`);

// //     const decrypted = decrypt(encResp, process.env.CCAV_WORKING_KEY);
// //     console.log(`[${reqId}] Decrypted string length:`, decrypted.length);

// //     const parsed = qs.parse(decrypted);

// //     console.log(`[${reqId}] Gateway response parsed:`);
// //     console.log(parsed);

// //     const orderId = parsed.merchant_param1;

// //     console.log(`[${reqId}] Step 3: OrderId extracted:`, orderId);

// //     if (!orderId) {
// //       throw new Error("merchant_param1 missing");
// //     }

// //     /*
// //     Start transaction
// //     */
// //     console.log(`[${reqId}] Step 4: Starting DB transaction`);

// //     transaction = await sequelize.transaction();

// //     console.log(`[${reqId}] Transaction started`);

// //     /*
// //     Lock order
// //     */
// //     console.log(`[${reqId}] Step 5: Fetching order`);

// //     const order = await Order.findByPk(orderId, {
// //       transaction,
// //       lock: transaction.LOCK.UPDATE,
// //     });

// //     if (!order) {
// //       throw new Error("Order not found");
// //     }

// //     console.log(`[${reqId}] Order found`, {
// //       id: order.id,
// //       productId: order.productId,
// //       quantity: order.quantity,
// //       paymentStatus: order.paymentStatus,
// //     });

// //     /*
// //     Idempotency protection
// //     */
// //     if (
// //       order.paymentStatus === "PAID" ||
// //       order.paymentStatus === "FAILED" ||
// //       order.paymentStatus === "CANCELLED"
// //     ) {
// //       console.log(`[${reqId}] Already processed`);

// //       await transaction.commit();

// //       return res.redirect(
// //         `${FRONTEND_BASE}/dashboard/payment-status?orderId=${orderId}&status=${order.paymentStatus}`
// //       );
// //     }

// //     /*
// //     Determine final status
// //     */
// //     console.log(`[${reqId}] Step 6: Determining payment status`);

// //     let finalStatus = "FAILED";

// //     switch (parsed.order_status) {
// //       case "Success":
// //         finalStatus = "PAID";
// //         break;

// //       case "Aborted":
// //         finalStatus = "CANCELLED";
// //         break;

// //       case "Failure":
// //         finalStatus = "FAILED";
// //         break;
// //     }

// //     console.log(`[${reqId}] Final status:`, finalStatus);

// //     /*
// //     Proper payment method mapping
// //     */
// //     const mapPaymentMethod = (mode) => {
// //       if (!mode || mode === "null") return "OTHER";

// //       const m = mode.toLowerCase();

// //       if (m.includes("upi")) return "UPI";

// //       if (m.includes("card") || m.includes("credit") || m.includes("debit"))
// //         return "CARD";

// //       if (m.includes("cash")) return "CASH";

// //       return "OTHER";
// //     };

// //     /*
// //     Update order
// //     */
// //     console.log(`[${reqId}] Step 7: Updating order`);

// //     await order.update(
// //       {
// //         paymentStatus: finalStatus,
// //         paymentMethod: mapPaymentMethod(parsed.payment_mode),
// //         gatewayTrackingId:
// //           parsed.tracking_id && parsed.tracking_id !== "null"
// //             ? parsed.tracking_id
// //             : null,
// //         paymentResponseRaw: JSON.stringify(parsed),
// //       },
// //       { transaction }
// //     );

// //     console.log(`[${reqId}] Order updated`);

// //     /*
// //     Restore stock if NOT paid
// //     */
// //     if (finalStatus !== "PAID") {
// //       console.log(`[${reqId}] Step 8: Restoring stock`);

// //       const product = await Product.findByPk(order.productId, {
// //         transaction,
// //         lock: transaction.LOCK.UPDATE,
// //       });

// //       if (!product) {
// //         throw new Error("Product not found");
// //       }

// //       console.log(`[${reqId}] Current stock:`, product.stock);

// //       await product.increment({ stock: order.quantity }, { transaction });

// //       await product.reload({ transaction });

// //       console.log(`[${reqId}] Stock restored →`, product.stock);
// //     }

// //     /*
// //     Commit
// //     */
// //     console.log(`[${reqId}] Step 9: Commit`);

// //     await transaction.commit();

// //     console.log(`[${reqId}] SUCCESS`);

// //     return res.redirect(
// //       `${FRONTEND_BASE}/dashboard/payment-status?orderId=${orderId}&status=${finalStatus}`
// //     );
// //   } catch (err) {
// //     console.error(`🔴 [${reqId}] ERROR`, err);

// //     if (transaction) {
// //       await transaction.rollback();
// //       console.log(`[${reqId}] Transaction rolled back`);
// //     }

// //     return res.redirect(
// //       `${FRONTEND_BASE}/dashboard/payment-status?status=ERROR`
// //     );
// //   }
// // };
// // const ccavenueResponseHandler = async (req, res) => {
// //   const reqId = uuidv4().slice(0, 8);

// //   console.log(`\n==============================`);
// //   console.log(`🟣 [${reqId}] PAYMENT RESPONSE START`);
// //   console.log(`==============================`);

// //   let transaction;

// //   try {
// //     const rawBody = req.body.toString();
// //     const parsedBody = qs.parse(rawBody);
// //     const encResp = parsedBody.encResp;

// //     if (!encResp) throw new Error("encResp missing");

// //     const decrypted = decrypt(encResp, process.env.CCAV_WORKING_KEY);
// //     const parsed = qs.parse(decrypted);

// //     console.log(`[${reqId}] 🔎 Gateway order_status:`, parsed.order_status);
// //     console.log(`[${reqId}] 🔎 tracking_id:`, parsed.tracking_id);
// //     console.log(`[${reqId}] 🔎 merchant_param1:`, parsed.merchant_param1);

// //     const orderId = parsed.merchant_param1;
// //     if (!orderId) throw new Error("merchant_param1 missing");

// //     transaction = await sequelize.transaction();
// //     console.log(`[${reqId}] 🔐 Transaction started`);

// //     const order = await Order.findByPk(orderId, {
// //       transaction,
// //       lock: transaction.LOCK.UPDATE,
// //     });

// //     if (!order) throw new Error("Order not found");

// //     console.log(`[${reqId}] 📦 Order before update:`, {
// //       id: order.id,
// //       productId: order.productId,
// //       quantity: order.quantity,
// //       paymentStatus: order.paymentStatus,
// //     });

// //     // Idempotency check
// //     if (["PAID", "FAILED", "CANCELLED"].includes(order.paymentStatus)) {
// //       console.log(`[${reqId}] ⚠️ Already processed →`, order.paymentStatus);
// //       await transaction.commit();
// //       return res.redirect(
// //         `${FRONTEND_BASE}/dashboard/payment-status?orderId=${orderId}&status=${order.paymentStatus}`
// //       );
// //     }

// //     let finalStatus = "FAILED";

// //     switch (parsed.order_status) {
// //       case "Success":
// //       case "Successful":
// //         finalStatus = "PAID";
// //         break;
// //       case "Aborted":
// //       case "Cancelled":
// //         finalStatus = "CANCELLED";
// //         break;
// //       case "Failure":
// //       case "Unsuccessful":
// //         finalStatus = "FAILED";
// //         break;
// //     }

// //     console.log(`[${reqId}] ✅ Final status resolved →`, finalStatus);

// //     const mapPaymentMethod = (mode) => {
// //       if (!mode) return "OTHER";

// //       const m = mode.toLowerCase();

// //       if (m.includes("upi")) return "UPI";
// //       if (m.includes("card")) return "CARD";
// //       if (m.includes("credit")) return "CARD";
// //       if (m.includes("debit")) return "CARD";
// //       if (m.includes("net")) return "NETBANKING";
// //       if (m.includes("wallet")) return "WALLET";

// //       return "OTHER";
// //     };
// //     console.log(
// //       `[${reqId}] Saving paymentMethod:`,
// //       mapPaymentMethod(parsed.payment_mode)
// //     );
// //     await order.update(
// //       {
// //         paymentStatus: finalStatus,
// //         paymentMethod: mapPaymentMethod(parsed.payment_mode),
// //         gatewayTrackingId: parsed.tracking_id || null,
// //         paymentResponseRaw: JSON.stringify(parsed),
// //       },
// //       { transaction }
// //     );

// //     console.log(`[${reqId}] 📝 Order updated to →`, finalStatus);

// //     const product = await Product.findByPk(order.productId, {
// //       transaction,
// //       lock: transaction.LOCK.UPDATE,
// //     });

// //     if (!product) throw new Error("Product not found");

// //     console.log(`[${reqId}] 📊 Product stock BEFORE logic:`, product.stock);

// //     if (finalStatus !== "PAID") {
// //       console.log(`[${reqId}] 🔄 Restoring stock...`);

// //       await product.increment({ stock: order.quantity }, { transaction });

// //       await product.reload({ transaction });

// //       console.log(`[${reqId}] 📊 Product stock AFTER restore:`, product.stock);
// //     } else {
// //       console.log(
// //         `[${reqId}] 🟢 Payment successful — NO stock restore (expected)`
// //       );
// //     }

// //     await transaction.commit();
// //     console.log(`[${reqId}] 💾 Transaction committed`);

// //     return res.redirect(
// //       `${FRONTEND_BASE}/dashboard/payment-status?orderId=${orderId}&status=${finalStatus}`
// //     );
// //   } catch (err) {
// //     console.error(`🔴 [${reqId}] ERROR →`, err.message);

// //     if (transaction) {
// //       await transaction.rollback();
// //       console.log(`[${reqId}] ❌ Transaction rolled back`);
// //     }

// //     return res.redirect(
// //       `${FRONTEND_BASE}/dashboard/payment-status?status=ERROR`
// //     );
// //   }
// // };

// // const ccavenueResponseHandler = async (req, res) => {
// //   const reqId = uuidv4().slice(0, 8);

// //   console.log(`\n==============================`);
// //   console.log(`🟣 [${reqId}] PAYMENT RESPONSE START`);
// //   console.log(`==============================`);

// //   let transaction;

// //   try {
// //     /*
// //     =====================================
// //     STEP 1: Read & decrypt redirect payload
// //     =====================================
// //     */

// //     const rawBody = req.body.toString();
// //     const parsedBody = qs.parse(rawBody);
// //     const encResp = parsedBody.encResp;

// //     if (!encResp) throw new Error("encResp missing");

// //     const decrypted = decrypt(encResp, process.env.CCAV_WORKING_KEY);
// //     const parsed = qs.parse(decrypted);

// //     const orderId = parsed.merchant_param1;
// //     if (!orderId) throw new Error("merchant_param1 missing");

// //     console.log(`[${reqId}] 🔎 Redirect order_status:`, parsed.order_status);
// //     console.log(`[${reqId}] 🔎 Redirect tracking_id:`, parsed.tracking_id);

// //     /*
// //     =====================================
// //     STEP 2: Start DB transaction
// //     =====================================
// //     */

// //     transaction = await sequelize.transaction();
// //     console.log(`[${reqId}] 🔐 Transaction started`);

// //     const order = await Order.findByPk(orderId, {
// //       transaction,
// //       lock: transaction.LOCK.UPDATE,
// //     });

// //     if (!order) throw new Error("Order not found");

// //     console.log(`[${reqId}] 📦 Order before update:`, {
// //       id: order.id,
// //       paymentStatus: order.paymentStatus,
// //       gatewayOrderId: order.gatewayOrderId,
// //     });

// //     /*
// //     =====================================
// //     STEP 3: Idempotency protection
// //     =====================================
// //     */

// //     if (["PAID", "FAILED", "CANCELLED"].includes(order.paymentStatus)) {
// //       console.log(`[${reqId}] ⚠️ Already processed`);
// //       await transaction.commit();
// //       return res.redirect(
// //         `${FRONTEND_BASE}/dashboard/payment-status?orderId=${orderId}&status=${order.paymentStatus}`
// //       );
// //     }

// //     /*
// //     =====================================
// //     STEP 4: Verify with CCA Lookup API
// //     =====================================
// //     */

// //     if (!order.gatewayOrderId) {
// //       throw new Error("gatewayOrderId missing in DB");
// //     }

// //     console.log(`[${reqId}] 📡 Verifying with CCA lookup...`);

// //     const gatewayData = await fetchSingleOrderFromCCA(
// //       order.gatewayOrderId,
// //       order.createdAt,
// //       reqId
// //     );

// //     if (!gatewayData) {
// //       throw new Error("Gateway lookup returned no data");
// //     }

// //     console.log(`[${reqId}] 📊 Lookup order_status:`, gatewayData.order_status);
// //     console.log(
// //       `[${reqId}] 📊 Lookup bank response:`,
// //       gatewayData.order_bank_response
// //     );

// //     /*
// //     =====================================
// //     STEP 5: Determine final status safely
// //     =====================================
// //     */

// //     let finalStatus = "FAILED";

// //     const status = (gatewayData.order_status || "").toLowerCase();
// //     const bankResp = (gatewayData.order_bank_response || "").toLowerCase();

// //     if (
// //       (status.includes("success") ||
// //         status.includes("ship") ||
// //         status.includes("capture")) &&
// //       bankResp === "approved"
// //     ) {
// //       finalStatus = "PAID";
// //     } else if (status.includes("abort") || status.includes("cancel")) {
// //       finalStatus = "CANCELLED";
// //     } else {
// //       finalStatus = "FAILED";
// //     }

// //     console.log(`[${reqId}] ✅ Final status resolved →`, finalStatus);

// //     /*
// //     =====================================
// //     STEP 6: Map payment method
// //     =====================================
// //     */

// //     const mapPaymentMethod = (cardName = "") => {
// //       const m = cardName.toLowerCase();

// //       if (m.includes("upi")) return "UPI";
// //       if (m.includes("card")) return "CARD";
// //       if (m.includes("credit")) return "CARD";
// //       if (m.includes("debit")) return "CARD";

// //       return "OTHER";
// //     };

// //     /*
// //     =====================================
// //     STEP 7: Update order
// //     =====================================
// //     */

// //     await order.update(
// //       {
// //         paymentStatus: finalStatus,
// //         paymentMethod: mapPaymentMethod(gatewayData.order_card_name),
// //         gatewayTrackingId: gatewayData.reference_no || null,
// //         paymentRef: gatewayData.order_bank_ref_no || null,
// //         paymentResponseRaw: JSON.stringify(gatewayData),
// //       },
// //       { transaction }
// //     );

// //     console.log(`[${reqId}] 📝 Order updated`);

// //     /*
// //     =====================================
// //     STEP 8: Restore stock ONLY if not paid
// //     =====================================
// //     */

// //     if (finalStatus !== "PAID") {
// //       console.log(`[${reqId}] 🔄 Restoring stock...`);

// //       const product = await Product.findByPk(order.productId, {
// //         transaction,
// //         lock: transaction.LOCK.UPDATE,
// //       });

// //       if (!product) throw new Error("Product not found");

// //       await product.increment({ stock: order.quantity }, { transaction });

// //       console.log(`[${reqId}] 📊 Stock restored`);
// //     } else {
// //       console.log(`[${reqId}] 🟢 Payment successful — stock unchanged`);
// //     }

// //     /*
// //     =====================================
// //     STEP 9: Commit transaction
// //     =====================================
// //     */

// //     await transaction.commit();
// //     console.log(`[${reqId}] 💾 Transaction committed`);

// //     return res.redirect(
// //       `${FRONTEND_BASE}/dashboard/payment-status?orderId=${orderId}&status=${finalStatus}`
// //     );
// //   } catch (err) {
// //     console.error(`🔴 [${reqId}] ERROR →`, err.message);

// //     if (transaction) {
// //       await transaction.rollback();
// //       console.log(`[${reqId}] ❌ Transaction rolled back`);
// //     }

// //     return res.redirect(
// //       `${FRONTEND_BASE}/dashboard/payment-status?status=ERROR`
// //     );
// //   }
// // };

// // const ccavenueResponseHandler = async (req, res) => {
// //   const reqId = uuidv4().slice(0, 8);

// //   console.log(`\n==============================`);
// //   console.log(`🟣 [${reqId}] PAYMENT RESPONSE START`);
// //   console.log(`==============================`);

// //   let transaction;

// //   try {
// //     /*
// //     If no body or encResp missing → treat as cancel
// //     */
// //     if (!req.body || !req.body.length) {
// //       console.log(`[${reqId}] No body received → Treat as CANCELLED`);
// //       return res.redirect(
// //         `${FRONTEND_BASE}/dashboard/payment-status?status=CANCELLED`
// //       );
// //     }

// //     const rawBody = req.body.toString();
// //     const parsedBody = qs.parse(rawBody);
// //     const encResp = parsedBody.encResp;

// //     if (!encResp) {
// //       console.log(`[${reqId}] encResp missing → Treat as CANCELLED`);
// //       return res.redirect(
// //         `${FRONTEND_BASE}/dashboard/payment-status?status=CANCELLED`
// //       );
// //     }

// //     const decrypted = decrypt(encResp, process.env.CCAV_WORKING_KEY);
// //     const parsed = qs.parse(decrypted);

// //     const redirectStatus = (parsed.order_status || "").toLowerCase();
// //     const orderId = parsed.merchant_param1;

// //     if (!orderId) {
// //       console.log(`[${reqId}] merchant_param1 missing`);
// //       return res.redirect(
// //         `${FRONTEND_BASE}/dashboard/payment-status?status=ERROR`
// //       );
// //     }

// //     transaction = await sequelize.transaction();

// //     const order = await Order.findByPk(orderId, {
// //       transaction,
// //       lock: transaction.LOCK.UPDATE,
// //     });

// //     if (!order) {
// //       await transaction.rollback();
// //       return res.redirect(
// //         `${FRONTEND_BASE}/dashboard/payment-status?status=ERROR`
// //       );
// //     }

// //     /*
// //     Idempotency
// //     */
// //     if (["PAID", "FAILED", "CANCELLED"].includes(order.paymentStatus)) {
// //       await transaction.commit();
// //       return res.redirect(
// //         `${FRONTEND_BASE}/dashboard/payment-status?orderId=${orderId}&status=${order.paymentStatus}`
// //       );
// //     }

// //     /*
// //     Handle immediate cancellation
// //     */
// //     if (redirectStatus.includes("abort") || redirectStatus.includes("cancel")) {
// //       await order.update({ paymentStatus: "CANCELLED" }, { transaction });

// //       const product = await Product.findByPk(order.productId, {
// //         transaction,
// //         lock: transaction.LOCK.UPDATE,
// //       });

// //       if (product) {
// //         await product.increment({ stock: order.quantity }, { transaction });
// //       }

// //       await transaction.commit();

// //       return res.redirect(
// //         `${FRONTEND_BASE}/dashboard/payment-status?orderId=${orderId}&status=CANCELLED`
// //       );
// //     }

// //     /*
// //     If success redirect → verify
// //     BUT if lookup empty → DO NOT FAIL
// //     */

// //     let finalStatus = "PENDING";

// //     if (order.gatewayOrderId) {
// //       const gatewayData = await fetchSingleOrderFromCCA(
// //         order.gatewayOrderId,
// //         order.createdAt,
// //         reqId
// //       );

// //       if (gatewayData) {
// //         const status = (gatewayData.order_status || "").toLowerCase();
// //         const bankResp = (gatewayData.order_bank_response || "").toLowerCase();

// //         if (
// //           (status.includes("success") ||
// //             status.includes("ship") ||
// //             status.includes("capture")) &&
// //           bankResp === "approved"
// //         ) {
// //           finalStatus = "PAID";
// //         } else if (status.includes("abort") || status.includes("cancel")) {
// //           finalStatus = "CANCELLED";
// //         } else {
// //           finalStatus = "FAILED";
// //         }
// //       } else {
// //         console.log(`[${reqId}] Lookup empty → leaving as PENDING`);
// //       }
// //     }

// //     if (finalStatus !== "PENDING") {
// //       await order.update({ paymentStatus: finalStatus }, { transaction });

// //       if (finalStatus !== "PAID") {
// //         const product = await Product.findByPk(order.productId, {
// //           transaction,
// //           lock: transaction.LOCK.UPDATE,
// //         });

// //         if (product) {
// //           await product.increment({ stock: order.quantity }, { transaction });
// //         }
// //       }
// //     }

// //     await transaction.commit();

// //     return res.redirect(
// //       `${FRONTEND_BASE}/dashboard/payment-status?orderId=${orderId}&status=${finalStatus}`
// //     );
// //   } catch (err) {
// //     console.error(`🔴 [${reqId}] ERROR →`, err.message);

// //     if (transaction) await transaction.rollback();

// //     return res.redirect(
// //       `${FRONTEND_BASE}/dashboard/payment-status?status=ERROR`
// //     );
// //   }
// // };

// const ccavenueResponseHandler = async (req, res) => {
//   const reqId = uuidv4().slice(0, 8);

//   console.log("\n==============================");
//   console.log(`🟣 [${reqId}] PAYMENT RESPONSE START`);
//   console.log("==============================");

//   let transaction;

//   try {
//     if (!req.body || !req.body.length) {
//       return res.redirect(
//         `${FRONTEND_BASE}/dashboard/payment-status?status=CANCELLED`
//       );
//     }

//     const rawBody = req.body.toString();
//     const parsedBody = qs.parse(rawBody);
//     const encResp = parsedBody.encResp;

//     if (!encResp) {
//       return res.redirect(
//         `${FRONTEND_BASE}/dashboard/payment-status?status=CANCELLED`
//       );
//     }

//     const decrypted = decrypt(encResp, process.env.CCAV_WORKING_KEY);
//     const parsed = qs.parse(decrypted);

//     const orderId = parsed.merchant_param1;
//     if (!orderId) {
//       return res.redirect(
//         `${FRONTEND_BASE}/dashboard/payment-status?status=ERROR`
//       );
//     }

//     transaction = await sequelize.transaction();

//     const order = await Order.findByPk(orderId, {
//       transaction,
//       lock: transaction.LOCK.UPDATE,
//     });

//     if (!order) {
//       await transaction.rollback();
//       return res.redirect(
//         `${FRONTEND_BASE}/dashboard/payment-status?status=ERROR`
//       );
//     }

//     /*
//     Idempotency
//     */
//     if (["PAID", "FAILED", "CANCELLED"].includes(order.paymentStatus)) {
//       await transaction.commit();
//       return res.redirect(
//         `${FRONTEND_BASE}/dashboard/payment-status?orderId=${orderId}&status=${order.paymentStatus}`
//       );
//     }

//     const status = (parsed.order_status || "").toLowerCase();

//     let finalStatus = "FAILED";

//     if (status.includes("success")) {
//       finalStatus = "PAID";
//     } else if (status.includes("abort")) {
//       finalStatus = "CANCELLED";
//     } else if (status.includes("fail")) {
//       finalStatus = "FAILED";
//     }

//     /*
//     IMPORTANT: Restore stock ONLY if
//     - Order was pending
//     - Final status is NOT PAID
//     */
//     if (order.paymentStatus === "PENDING" && finalStatus !== "PAID") {
//       const product = await Product.findByPk(order.productId, {
//         transaction,
//         lock: transaction.LOCK.UPDATE,
//       });

//       if (product) {
//         await product.increment({ stock: order.quantity }, { transaction });
//       }
//     }

//     await order.update(
//       {
//         paymentStatus: finalStatus,
//         gatewayTrackingId: parsed.tracking_id || null,
//         paymentRef: parsed.bank_ref_no || null,
//         paymentResponseRaw: JSON.stringify(parsed),
//       },
//       { transaction }
//     );

//     await transaction.commit();

//     return res.redirect(
//       `${FRONTEND_BASE}/dashboard/payment-status?orderId=${orderId}&status=${finalStatus}`
//     );
//   } catch (err) {
//     console.error("Payment Handler Error:", err.message);

//     if (transaction) await transaction.rollback();

//     return res.redirect(
//       `${FRONTEND_BASE}/dashboard/payment-status?status=ERROR`
//     );
//   }
// };

// module.exports = {
//   initiateCcavenuePayment,
//   ccavenueResponseHandler,
// };
