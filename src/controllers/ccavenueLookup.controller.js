// const { fetchPaymentHistory } = require("../services/ccavenueLookup.service");
const { Order } = require("../models");
const {
  fetchSingleOrderFromCCA,
} = require("../services/ccavenueFetchTransactions.service");
const { fetchPaymentHistory } = require("../services/ccavenueLookup.service");
const { v4: uuidv4 } = require("uuid");
const { getOrderDetailService } = require("../services/order.service");

const getPaymentHistory = async (req, res) => {
  try {
    const { fromDate, toDate, status, page } = req.query;

    if (!fromDate || !toDate) {
      return res.status(400).json({
        success: false,
        message: "fromDate and toDate are required (DD-MM-YYYY)",
      });
    }

    const data = await fetchPaymentHistory({
      fromDate,
      toDate,
      status,
      page: page ? Number(page) : 1,
    });

    return res.json({
      success: true,
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to fetch payment history",
    });
  }
};

// const getSingleOrderStatus = async (req, res) => {
//   const reqId = uuidv4().slice(0, 8);

//   console.log(`\n==============================`);
//   console.log(`🔵 [${reqId}] SINGLE ORDER LOOKUP START`);
//   console.log(`==============================`);

//   try {
//     const { orderId } = req.params;

//     console.log(`[${reqId}] 📥 UUID received:`, orderId);

//     const order = await Order.findByPk(orderId);

//     if (!order) {
//       console.log(`[${reqId}] ❌ Order not found`);
//       return res.status(404).json({
//         success: false,
//         message: "Order not found",
//       });
//     }

//     console.log(`[${reqId}] 📦 FULL ORDER OBJECT:`);
//     console.log(JSON.stringify(order.toJSON(), null, 2));

//     if (!order.gatewayOrderId) {
//       console.log(`[${reqId}] ⚠️ gatewayOrderId is NULL`);
//       return res.json({
//         success: true,
//         data: {
//           localOrder: order,
//           gatewayOrder: null,
//           note: "Payment not initiated yet",
//         },
//       });
//     }

//     console.log(
//       `[${reqId}] 📡 Calling CCA with gatewayOrderId:`,
//       order.gatewayOrderId
//     );

//     const gatewayData = await fetchSingleOrderFromCCA(
//       order.gatewayOrderId,
//       reqId
//     );

//     console.log(`[${reqId}] 📊 Gateway Data:`);
//     console.log(JSON.stringify(gatewayData, null, 2));

//     return res.json({
//       success: true,
//       data: {
//         localOrder: order,
//         gatewayOrder: gatewayData,
//       },
//     });
//   } catch (err) {
//     console.error(`[${reqId}] 🔴 ERROR →`, err.message);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch order status",
//     });
//   }
// };

// const { getOrderDetailService } = require("../services/order.service");

const getSingleOrderStatus = async (req, res) => {
  const reqId = uuidv4().slice(0, 8);

  console.log(`\n==============================`);
  console.log(`🔵 [${reqId}] SINGLE ORDER LOOKUP START`);
  console.log(`==============================`);

  try {
    const { orderId } = req.params;

    console.log(`[${reqId}] 📥 UUID received:`, orderId);

    // ✅ Use existing service instead of querying DB directly
    const result = await getOrderDetailService({ id: orderId });

    if (!result.ok) {
      console.log(`[${reqId}] ❌ Order not found via service`);
      return res.status(result.statusCode).json({
        success: false,
        message: result.message,
      });
    }

    const order = result.data;

    console.log(`[${reqId}] ✅ Order fetched via service`);
    console.log(JSON.stringify(order, null, 2));

    if (!order.gatewayOrderId) {
      console.log(`[${reqId}] ⚠️ gatewayOrderId is NULL`);

      return res.json({
        success: true,
        data: {
          localOrder: order,
          gatewayOrder: null,
          note: "Payment not initiated yet",
        },
      });
    }

    console.log(
      `[${reqId}] 📡 Calling CCA with gatewayOrderId:`,
      order.gatewayOrderId
    );

    const gatewayData = await fetchSingleOrderFromCCA(
      order.gatewayOrderId,
      order.createdAt,
      reqId
    );

    console.log(`[${reqId}] 📊 Gateway Data Received`);

    return res.json({
      success: true,
      data: {
        localOrder: order,
        gatewayOrder: gatewayData,
      },
    });
  } catch (err) {
    console.error(`[${reqId}] 🔴 ERROR →`, err.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch order status",
    });
  }
};

module.exports = {
  getPaymentHistory,
  getSingleOrderStatus,
};
