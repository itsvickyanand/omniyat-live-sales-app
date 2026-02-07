// const qs = require("querystring");
// const { encrypt, decrypt } = require("../utils/ccavenue");
// const { Order, Product, sequelize } = require("../models");
// const { v4: uuidv4 } = require("uuid");

// // ✅ Initiate payment for an existing order

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

//     // Prevent duplicate payment attempts
//     if (order.paymentStatus === "PAID") {
//       return res.status(400).json({
//         success: false,
//         message: "Order already paid",
//       });
//     }

//     const {
//       CCAV_MERCHANT_ID: merchantId,
//       CCAV_ACCESS_CODE: accessCode,
//       CCAV_WORKING_KEY: workingKey,
//       CCAV_REDIRECT_URL: redirectUrl,
//       CCAV_CANCEL_URL: cancelUrl,
//     } = process.env;

//     if (!merchantId || !accessCode || !workingKey) {
//       console.error(`[${reqId}] Missing CCAvenue credentials`);

//       return res.status(500).json({
//         success: false,
//         message: "Payment gateway not configured",
//       });
//     }

//     // Generate short order ID (CCAvenue requirement)
//     const shortOrderId = order.id.replace(/-/g, "").substring(0, 20);

//     const rawData = {
//       merchant_id: merchantId,
//       order_id: shortOrderId,
//       currency: "AED",
//       amount: Number(order.amount).toFixed(2),

//       redirect_url: redirectUrl,
//       cancel_url: cancelUrl,

//       billing_name: order.customerName,
//       billing_email: order.customerEmail,
//       billing_tel: order.customerPhone,

//       billing_address: "NA",
//       billing_city: "NA",
//       billing_state: "NA",
//       billing_zip: "00000",
//       billing_country: "AE",

//       merchant_param1: order.id,
//       merchant_param2: order.customerEmail || "",
//       merchant_param3: order.customerPhone || "",

//       language: "EN",
//     };

//     const rawString = qs.stringify(rawData);

//     const encRequest = encrypt(rawString, workingKey);

//     // Store mapping
//     order.paymentMode = "ONLINE";
//     order.gatewayOrderId = shortOrderId;

//     await order.save();

//     console.log(`[${reqId}] INITIATE SUCCESS`);

//     return res.json({
//       success: true,
//       accessCode,
//       encRequest,
//       orderId: order.id,
//     });
//   } catch (err) {
//     console.error(`[${reqId}] INITIATE ERROR`, err);

//     return res.status(500).json({
//       success: false,
//       message: "Payment initiation failed",
//     });
//   }
// };

// const ccavenueResponseHandler = async (req, res) => {
//   const reqId = uuidv4().slice(0, 8);

//   console.log(`\n🟣 [${reqId}] PAYMENT RESPONSE`);

//   const frontendBase = process.env.FRONTEND_BASE_URL || "http://localhost:3001";

//   try {
//     const rawBody = req.body.toString();

//     const parsedBody = qs.parse(rawBody);

//     const encResp = parsedBody.encResp;

//     if (!encResp) {
//       throw new Error("encResp missing");
//     }

//     const decrypted = decrypt(encResp, process.env.CCAV_WORKING_KEY);

//     const parsed = qs.parse(decrypted);

//     const orderId = parsed.merchant_param1;

//     if (!orderId) {
//       throw new Error("Invalid payment response: orderId missing");
//     }

//     const order = await Order.findByPk(orderId);

//     if (!order) {
//       throw new Error("Order not found");
//     }

//     // Idempotency protection
//     if (order.paymentStatus === "PAID") {
//       console.log(`[${reqId}] Already processed`);

//       return res.redirect(
//         `${frontendBase}/dashboard/payment-status?orderId=${orderId}&status=SUCCESS`
//       );
//     }

//     const paymentStatus = parsed.order_status;

//     const updatePayload = {
//       gatewayTrackingId: parsed.tracking_id || null,
//       paymentResponseRaw: JSON.stringify(parsed),
//     };

//     if (paymentStatus === "Success") {
//       updatePayload.paymentStatus = "PAID";
//       updatePayload.paymentMethod = parsed.payment_mode || "ONLINE";

//       console.log(`[${reqId}] PAYMENT SUCCESS`);
//     } else if (paymentStatus === "Aborted") {
//       updatePayload.paymentStatus = "CANCELLED";

//       console.log(`[${reqId}] PAYMENT CANCELLED`);
//     } else {
//       updatePayload.paymentStatus = "FAILED";

//       console.log(`[${reqId}] PAYMENT FAILED`);
//     }

//     await order.update(updatePayload);

//     return res.redirect(
//       `${frontendBase}/dashboard/payment-status?orderId=${orderId}&status=${updatePayload.paymentStatus}`
//     );
//   } catch (err) {
//     console.error(`[${reqId}] RESPONSE ERROR`, err);

//     return res.redirect(
//       `${frontendBase}/dashboard/payment-status?status=ERROR`
//     );
//   }
// };

// module.exports = {
//   initiateCcavenuePayment,
//   ccavenueResponseHandler,
// };

const qs = require("querystring");
const { encrypt, decrypt } = require("../utils/ccavenue");
const { Order } = require("../models");
const { v4: uuidv4 } = require("uuid");

const FRONTEND_BASE = process.env.FRONTEND_BASE_URL || "http://localhost:3001";

/*
===========================================================
INITIATE PAYMENT
===========================================================
*/
const initiateCcavenuePayment = async (req, res) => {
  const reqId = uuidv4().slice(0, 8);

  console.log(`\n🟢 [${reqId}] INITIATE PAYMENT START`);

  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "orderId is required",
      });
    }

    const order = await Order.findByPk(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    /*
    Prevent duplicate payment attempts
    */
    if (order.paymentStatus === "PAID") {
      return res.status(400).json({
        success: false,
        message: "Order already paid",
      });
    }

    /*
    Validate environment
    */
    const {
      CCAV_MERCHANT_ID,
      CCAV_ACCESS_CODE,
      CCAV_WORKING_KEY,
      CCAV_REDIRECT_URL,
      CCAV_CANCEL_URL,
    } = process.env;

    if (
      !CCAV_MERCHANT_ID ||
      !CCAV_ACCESS_CODE ||
      !CCAV_WORKING_KEY ||
      !CCAV_REDIRECT_URL ||
      !CCAV_CANCEL_URL
    ) {
      console.error(`[${reqId}] Missing gateway env config`);

      return res.status(500).json({
        success: false,
        message: "Payment gateway not configured",
      });
    }

    /*
    Generate short ID (CCAvenue limit)
    */
    const shortOrderId = order.id.replace(/-/g, "").substring(0, 20);

    /*
    Prepare gateway payload
    */
    const rawData = {
      merchant_id: CCAV_MERCHANT_ID,
      order_id: shortOrderId,

      currency: "AED",
      amount: Number(order.amount).toFixed(2),

      redirect_url: CCAV_REDIRECT_URL,
      cancel_url: CCAV_CANCEL_URL,

      billing_name: order.customerName,
      billing_email: order.customerEmail,
      billing_tel: order.customerPhone,

      billing_address: "NA",
      billing_city: "NA",
      billing_state: "NA",
      billing_zip: "00000",
      billing_country: "AE",

      /*
      Critical mapping fields
      */
      merchant_param1: order.id,
      merchant_param2: order.customerEmail || "",
      merchant_param3: order.customerPhone || "",

      language: "EN",
    };

    const rawString = qs.stringify(rawData);

    const encRequest = encrypt(rawString, CCAV_WORKING_KEY);

    /*
    Update order safely
    */
    await order.update({
      paymentMode: "ONLINE",
      paymentStatus: "PENDING",
      gatewayOrderId: shortOrderId,
    });

    console.log(`🟢 [${reqId}] INITIATE SUCCESS`);

    return res.json({
      success: true,
      accessCode: CCAV_ACCESS_CODE,
      encRequest,
      orderId: order.id,
    });
  } catch (err) {
    console.error(`🔴 [${reqId}] INITIATE ERROR`, err);

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
const ccavenueResponseHandler = async (req, res) => {
  const reqId = uuidv4().slice(0, 8);

  console.log(`\n🟣 [${reqId}] PAYMENT RESPONSE`);

  try {
    /*
    RAW body required
    */
    const rawBody = req.body.toString();

    const parsedBody = qs.parse(rawBody);

    const encResp = parsedBody.encResp;

    if (!encResp) {
      throw new Error("encResp missing");
    }

    /*
    Decrypt response
    */
    const decrypted = decrypt(encResp, process.env.CCAV_WORKING_KEY);

    const parsed = qs.parse(decrypted);

    console.log(`[${reqId}] Gateway response`, parsed);

    const orderId = parsed.merchant_param1;

    if (!orderId) {
      throw new Error("merchant_param1 missing");
    }

    const order = await Order.findByPk(orderId);

    if (!order) {
      throw new Error("Order not found");
    }

    /*
    Idempotency protection
    */
    if (order.paymentStatus === "PAID") {
      console.log(`[${reqId}] Already processed`);

      return res.redirect(
        `${FRONTEND_BASE}/dashboard/payment-status?orderId=${orderId}&status=SUCCESS`
      );
    }

    /*
    Determine final payment status
    */
    const gatewayStatus = parsed.order_status;

    let finalStatus = "FAILED";

    switch (gatewayStatus) {
      case "Success":
        finalStatus = "PAID";
        break;

      case "Aborted":
        finalStatus = "CANCELLED";
        break;

      case "Failure":
        finalStatus = "FAILED";
        break;

      default:
        finalStatus = "FAILED";
    }

    /*
    Update order safely
    */
    await order.update({
      paymentStatus: finalStatus,
      paymentMethod: parsed.payment_mode || "ONLINE",
      gatewayTrackingId: parsed.tracking_id || null,
      paymentResponseRaw: JSON.stringify(parsed),
    });

    console.log(`[${reqId}] FINAL STATUS → ${finalStatus}`);

    return res.redirect(
      `${FRONTEND_BASE}/dashboard/payment-status?orderId=${orderId}&status=${finalStatus}`
    );
  } catch (err) {
    console.error(`🔴 [${reqId}] RESPONSE ERROR`, err);

    return res.redirect(
      `${FRONTEND_BASE}/dashboard/payment-status?status=ERROR`
    );
  }
};

module.exports = {
  initiateCcavenuePayment,
  ccavenueResponseHandler,
};
