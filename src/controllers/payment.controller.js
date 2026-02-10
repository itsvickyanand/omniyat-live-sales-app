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

  console.log(`\n==============================`);
  console.log(`🟣 [${reqId}] PAYMENT RESPONSE START`);
  console.log(`==============================`);

  let transaction;

  try {
    console.log(`[${reqId}] Step 1: Reading raw body`);

    const rawBody = req.body.toString();
    console.log(`[${reqId}] Raw body length:`, rawBody.length);

    const parsedBody = qs.parse(rawBody);
    console.log(`[${reqId}] Parsed body keys:`, Object.keys(parsedBody));

    const encResp = parsedBody.encResp;

    if (!encResp) {
      console.log(`[${reqId}] ❌ encResp missing`);
      throw new Error("encResp missing");
    }

    console.log(`[${reqId}] Step 2: Decrypting response`);

    const decrypted = decrypt(encResp, process.env.CCAV_WORKING_KEY);
    console.log(`[${reqId}] Decrypted string length:`, decrypted.length);

    const parsed = qs.parse(decrypted);

    console.log(`[${reqId}] Gateway response parsed:`);
    console.log(parsed);

    const orderId = parsed.merchant_param1;

    console.log(`[${reqId}] Step 3: OrderId extracted:`, orderId);

    if (!orderId) {
      throw new Error("merchant_param1 missing");
    }

    /*
    Start transaction
    */
    console.log(`[${reqId}] Step 4: Starting DB transaction`);

    transaction = await sequelize.transaction();

    console.log(`[${reqId}] Transaction started`);

    /*
    Lock order
    */
    console.log(`[${reqId}] Step 5: Fetching order`);

    const order = await Order.findByPk(orderId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!order) {
      throw new Error("Order not found");
    }

    console.log(`[${reqId}] Order found`, {
      id: order.id,
      productId: order.productId,
      quantity: order.quantity,
      paymentStatus: order.paymentStatus,
    });

    /*
    Idempotency protection
    */
    if (
      order.paymentStatus === "PAID" ||
      order.paymentStatus === "FAILED" ||
      order.paymentStatus === "CANCELLED"
    ) {
      console.log(`[${reqId}] Already processed`);

      await transaction.commit();

      return res.redirect(
        `${FRONTEND_BASE}/dashboard/payment-status?orderId=${orderId}&status=${order.paymentStatus}`
      );
    }

    /*
    Determine final status
    */
    console.log(`[${reqId}] Step 6: Determining payment status`);

    let finalStatus = "FAILED";

    switch (parsed.order_status) {
      case "Success":
        finalStatus = "PAID";
        break;

      case "Aborted":
        finalStatus = "CANCELLED";
        break;

      case "Failure":
        finalStatus = "FAILED";
        break;
    }

    console.log(`[${reqId}] Final status:`, finalStatus);

    /*
    Proper payment method mapping
    */
    const mapPaymentMethod = (mode) => {
      if (!mode || mode === "null") return "OTHER";

      const m = mode.toLowerCase();

      if (m.includes("upi")) return "UPI";

      if (m.includes("card") || m.includes("credit") || m.includes("debit"))
        return "CARD";

      if (m.includes("cash")) return "CASH";

      return "OTHER";
    };

    /*
    Update order
    */
    console.log(`[${reqId}] Step 7: Updating order`);

    await order.update(
      {
        paymentStatus: finalStatus,
        paymentMethod: mapPaymentMethod(parsed.payment_mode),
        gatewayTrackingId:
          parsed.tracking_id && parsed.tracking_id !== "null"
            ? parsed.tracking_id
            : null,
        paymentResponseRaw: JSON.stringify(parsed),
      },
      { transaction }
    );

    console.log(`[${reqId}] Order updated`);

    /*
    Restore stock if NOT paid
    */
    if (finalStatus !== "PAID") {
      console.log(`[${reqId}] Step 8: Restoring stock`);

      const product = await Product.findByPk(order.productId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!product) {
        throw new Error("Product not found");
      }

      console.log(`[${reqId}] Current stock:`, product.stock);

      await product.increment({ stock: order.quantity }, { transaction });

      await product.reload({ transaction });

      console.log(`[${reqId}] Stock restored →`, product.stock);
    }

    /*
    Commit
    */
    console.log(`[${reqId}] Step 9: Commit`);

    await transaction.commit();

    console.log(`[${reqId}] SUCCESS`);

    return res.redirect(
      `${FRONTEND_BASE}/dashboard/payment-status?orderId=${orderId}&status=${finalStatus}`
    );
  } catch (err) {
    console.error(`🔴 [${reqId}] ERROR`, err);

    if (transaction) {
      await transaction.rollback();
      console.log(`[${reqId}] Transaction rolled back`);
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
