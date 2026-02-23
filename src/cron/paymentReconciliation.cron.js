// const cron = require("node-cron");
// const { Op } = require("sequelize");
// const { Order, Product, sequelize } = require("../models");
// const {
//   fetchSingleOrderFromCCA,
// } = require("../services/ccavenueFetchTransactions.service");

// const runPaymentReconciliation = () => {
//   cron.schedule("*/5 * * * *", async () => {
//     console.log("🕒 Running Payment Reconciliation Cron...");

//     try {
//       /*
//       Find pending online orders
//       */
//       const pendingOrders = await Order.findAll({
//         where: {
//           paymentStatus: "PENDING",
//           gatewayOrderId: {
//             [Op.ne]: null,
//           },
//         },
//       });

//       if (!pendingOrders.length) {
//         console.log("✅ No pending payments to reconcile");
//         return;
//       }

//       console.log(`🔎 Found ${pendingOrders.length} pending orders`);

//       for (const order of pendingOrders) {
//         const reqId = `CRON-${order.id.substring(0, 6)}`;

//         try {
//           console.log(`[${reqId}] Verifying order...`);

//           const gatewayData = await fetchSingleOrderFromCCA(
//             order.gatewayOrderId,
//             order.createdAt,
//             reqId
//           );

//           if (!gatewayData) {
//             console.log(`[${reqId}] No gateway data returned`);
//             continue;
//           }

//           const status = (gatewayData.order_status || "").toLowerCase();
//           const bankResp = (
//             gatewayData.order_bank_response || ""
//           ).toLowerCase();

//           let finalStatus = "FAILED";

//           if (
//             (status.includes("success") ||
//               status.includes("ship") ||
//               status.includes("capture")) &&
//             bankResp === "approved"
//           ) {
//             finalStatus = "PAID";
//           } else if (status.includes("abort") || status.includes("cancel")) {
//             finalStatus = "CANCELLED";
//           } else {
//             finalStatus = "FAILED";
//           }

//           if (finalStatus === "PENDING") continue;

//           await sequelize.transaction(async (t) => {
//             const freshOrder = await Order.findByPk(order.id, {
//               transaction: t,
//               lock: t.LOCK.UPDATE,
//             });

//             if (!freshOrder) return;

//             if (freshOrder.paymentStatus !== "PENDING") return;

//             await freshOrder.update(
//               {
//                 paymentStatus: finalStatus,
//                 gatewayTrackingId: gatewayData.reference_no || null,
//                 paymentRef: gatewayData.order_bank_ref_no || null,
//                 paymentResponseRaw: JSON.stringify(gatewayData),
//               },
//               { transaction: t }
//             );

//             if (finalStatus !== "PAID") {
//               const product = await Product.findByPk(freshOrder.productId, {
//                 transaction: t,
//                 lock: t.LOCK.UPDATE,
//               });

//               if (product) {
//                 await product.increment(
//                   { stock: freshOrder.quantity },
//                   { transaction: t }
//                 );
//               }
//             }

//             console.log(`[${reqId}] Updated to ${finalStatus}`);
//           });
//         } catch (err) {
//           console.error(`[${reqId}] Error →`, err.message);
//         }
//       }
//     } catch (err) {
//       console.error("Cron Error:", err.message);
//     }
//   });
// };

// module.exports = runPaymentReconciliation;

const cron = require("node-cron");
const { Op } = require("sequelize");
const { Order, Product, sequelize } = require("../models");
const {
  fetchSingleOrderFromCCA,
} = require("../services/ccavenueFetchTransactions.service");
const {
  cancelOrderService,
  markOrderPaidService,
} = require("../services/order.service");

const MAX_RETRIES = 5;
const RECONCILIATION_WINDOW_HOURS = 24;

// const shouldRunCron = () => {
//   return (
//     process.env.NODE_ENV === "production" || process.env.NODE_ENV === "staging"
//   );
// };
const shouldRunCron = () => true;

// const runPaymentReconciliation = () => {
//   if (!shouldRunCron()) {
//     console.log("⚠️ Payment reconciliation cron disabled in this environment");
//     return;
//   }

//   cron.schedule("*/5 * * * *", async () => {
//     console.log("🕒 [CRON] Payment Reconciliation Started");

//     try {
//       const windowTime = new Date();
//       windowTime.setHours(windowTime.getHours() - RECONCILIATION_WINDOW_HOURS);

//       const pendingOrders = await Order.findAll({
//         where: {
//           paymentStatus: "PENDING",
//           gatewayOrderId: { [Op.ne]: null },
//           reconciliationAttempts: { [Op.lt]: MAX_RETRIES },
//           createdAt: { [Op.gte]: windowTime },
//         },
//       });

//       if (!pendingOrders.length) {
//         console.log("✅ [CRON] No pending payments found");
//         return;
//       }

//       console.log(`🔎 [CRON] Found ${pendingOrders.length} pending orders`);

//       for (const order of pendingOrders) {
//         const reqId = `CRON-${order.id.substring(0, 6)}`;

//         try {
//           console.log(`[${reqId}] Verifying order`);

//           const gatewayData = await fetchSingleOrderFromCCA(
//             order.gatewayOrderId,
//             order.createdAt,
//             reqId
//           );

//           if (!gatewayData) {
//             console.log(`[${reqId}] No gateway data returned`);
//             continue;
//           }

//           const status = (gatewayData.order_status || "").toLowerCase();
//           const bankResp = (
//             gatewayData.order_bank_response || ""
//           ).toLowerCase();

//           let finalStatus = "FAILED";

//           if (
//             (status.includes("success") ||
//               status.includes("ship") ||
//               status.includes("capture")) &&
//             bankResp === "approved"
//           ) {
//             finalStatus = "PAID";
//           } else if (status.includes("abort") || status.includes("cancel")) {
//             finalStatus = "CANCELLED";
//           } else {
//             finalStatus = "FAILED";
//           }

//           await sequelize.transaction(async (t) => {
//             const freshOrder = await Order.findByPk(order.id, {
//               transaction: t,
//               lock: t.LOCK.UPDATE,
//             });

//             if (!freshOrder) return;
//             if (freshOrder.paymentStatus !== "PENDING") return;

//             await freshOrder.update(
//               {
//                 paymentStatus: finalStatus,
//                 gatewayTrackingId: gatewayData.reference_no || null,
//                 paymentRef: gatewayData.order_bank_ref_no || null,
//                 paymentResponseRaw: JSON.stringify(gatewayData),
//                 reconciliationAttempts: freshOrder.reconciliationAttempts + 1,
//                 lastReconciliationAt: new Date(),
//               },
//               { transaction: t }
//             );

//             if (finalStatus !== "PAID") {
//               const product = await Product.findByPk(freshOrder.productId, {
//                 transaction: t,
//                 lock: t.LOCK.UPDATE,
//               });

//               if (product) {
//                 await product.increment(
//                   { stock: freshOrder.quantity },
//                   { transaction: t }
//                 );
//               }
//             }

//             console.log(`[${reqId}] Updated to ${finalStatus}`);
//           });
//         } catch (err) {
//           console.error(`[${reqId}] Error:`, err.message);

//           await order.increment("reconciliationAttempts");
//         }
//       }
//     } catch (err) {
//       console.error("🚨 [CRON] Fatal Error:", err.message);
//     }
//   });
// };

const runPaymentReconciliation = () => {
  if (!shouldRunCron()) {
    console.log("⚠️ Payment reconciliation cron disabled in this environment");
    return;
  }

  cron.schedule("*/5 * * * *", async () => {
    console.log("🕒 [CRON] Payment Reconciliation Started");

    try {
      const windowTime = new Date();
      windowTime.setHours(windowTime.getHours() - RECONCILIATION_WINDOW_HOURS);

      const pendingOrders = await Order.findAll({
        where: {
          paymentStatus: "PENDING",
          gatewayOrderId: { [Op.ne]: null },
          reconciliationAttempts: { [Op.lt]: MAX_RETRIES },
          createdAt: { [Op.gte]: windowTime },
        },
      });

      if (!pendingOrders.length) {
        console.log("✅ [CRON] No pending payments found");
        return;
      }

      console.log(`🔎 [CRON] Found ${pendingOrders.length} pending orders`);

      for (const order of pendingOrders) {
        const reqId = `CRON-${order.id.substring(0, 6)}`;

        try {
          console.log(`[${reqId}] Verifying order`);

          const gatewayData = await fetchSingleOrderFromCCA(
            order.gatewayOrderId,
            order.createdAt,
            reqId
          );

          let finalStatus = "PENDING";

          if (gatewayData) {
            const status = (gatewayData.order_status || "").toLowerCase();
            const bankResp = (
              gatewayData.order_bank_response || ""
            ).toLowerCase();

            if (
              (status.includes("success") ||
                status.includes("ship") ||
                status.includes("capture")) &&
              bankResp === "approved"
            ) {
              finalStatus = "PAID";
            } else if (status.includes("abort") || status.includes("cancel")) {
              finalStatus = "CANCELLED";
            } else {
              finalStatus = "FAILED";
            }
          } else {
            const ageMs = Date.now() - new Date(order.createdAt).getTime();

            const FIFTEEN_MIN = 10 * 60 * 1000;

            if (ageMs > FIFTEEN_MIN) {
              console.log(`[${reqId}] Abandoned order. Cancelling...`);

              await cancelOrderService({ id: order.id });
            } else {
              console.log(`[${reqId}] Still within payment window`);
            }
            console.log(`[${reqId}] No gateway data returned`);
          }

          /*
            Only act if resolved
            */
          if (finalStatus === "PAID") {
            console.log(`[${reqId}] Marking as PAID via service`);

            await markOrderPaidService({
              id: order.id,
              paymentMethod: "CARD",
              paymentRef: gatewayData?.order_bank_ref_no || null,
            });
          }

          if (finalStatus === "CANCELLED" || finalStatus === "FAILED") {
            console.log(`[${reqId}] Cancelling via service`);

            await cancelOrderService({ id: order.id });
          }

          /*
            Increment reconciliation attempts
            */
          await order.increment("reconciliationAttempts");
        } catch (err) {
          console.error(`[${reqId}] Error:`, err.message);
          await order.increment("reconciliationAttempts");
        }
      }
    } catch (err) {
      console.error("🚨 [CRON] Fatal Error:", err.message);
    }
  });
};

module.exports = runPaymentReconciliation;
