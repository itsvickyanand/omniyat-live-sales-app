// const {
//   createOrderService,
//   getAllOrdersService,
//   cancelOrderService,
//   markOrderPaidService,
//   getOrderDetailService,
//   deleteOrderService,
// } = require("../services/order.service");

// const { sendResponse } = require("../utils/apiResponse");

// // ✅ Create Order (POS)
// const createOrder = async (req, res) => {
//   try {
//     const result = await createOrderService(req.body);

//     return sendResponse(
//       res,
//       result.statusCode,
//       result.ok,
//       result.message,
//       result.data || null,
//       result.error || null
//     );
//   } catch (err) {
//     return sendResponse(
//       res,
//       500,
//       false,
//       "Internal Server Error",
//       null,
//       err.message
//     );
//   }
// };

// // ✅ Get All Orders
// const getAllOrders = async (req, res) => {
//   try {
//     const result = await getAllOrdersService();

//     return sendResponse(
//       res,
//       200,
//       true,
//       result.message,
//       result.data || [],
//       null
//     );
//   } catch (err) {
//     return sendResponse(
//       res,
//       500,
//       false,
//       "Internal Server Error",
//       null,
//       err.message
//     );
//   }
// };

// // ✅ Cancel Order
// const cancelOrder = async (req, res) => {
//   try {
//     const id = req.params.id?.trim();

//     if (!id) {
//       return sendResponse(
//         res,
//         400,
//         false,
//         "Order id is required",
//         null,
//         "VALIDATION_ERROR"
//       );
//     }

//     const result = await cancelOrderService({ id });

//     return sendResponse(
//       res,
//       result.statusCode,
//       result.ok,
//       result.message,
//       result.data || null,
//       result.error || null
//     );
//   } catch (err) {
//     return sendResponse(
//       res,
//       500,
//       false,
//       "Internal Server Error",
//       null,
//       err.message
//     );
//   }
// };

// // ✅ Mark Paid
// const markOrderPaid = async (req, res) => {
//   try {
//     const id = req.params.id?.trim();

//     if (!id) {
//       return sendResponse(
//         res,
//         400,
//         false,
//         "Order id is required",
//         null,
//         "VALIDATION_ERROR"
//       );
//     }

//     const result = await markOrderPaidService({ id, ...req.body });

//     return sendResponse(
//       res,
//       result.statusCode,
//       result.ok,
//       result.message,
//       result.data || null,
//       result.error || null
//     );
//   } catch (err) {
//     return sendResponse(
//       res,
//       500,
//       false,
//       "Internal Server Error",
//       null,
//       err.message
//     );
//   }
// };

// const getOrderDetail = async (req, res) => {
//   try {
//     const id = req.params.id?.trim();

//     if (!id) {
//       return sendResponse(
//         res,
//         400,
//         false,
//         "Order id is required",
//         null,
//         "VALIDATION_ERROR"
//       );
//     }

//     const result = await getOrderDetailService({ id });

//     return sendResponse(
//       res,
//       result.statusCode,
//       result.ok,
//       result.message,
//       result.data || null,
//       result.error || null
//     );
//   } catch (err) {
//     return sendResponse(
//       res,
//       500,
//       false,
//       "Internal Server Error",
//       null,
//       err.message
//     );
//   }
// };

// const deleteOrder = async (req, res) => {
//   try {
//     const id = req.params.id?.trim();

//     if (!id) {
//       return sendResponse(
//         res,
//         400,
//         false,
//         "Order id is required",
//         null,
//         "VALIDATION_ERROR"
//       );
//     }

//     const result = await deleteOrderService({ id });

//     return sendResponse(
//       res,
//       result.statusCode,
//       result.ok,
//       result.message,
//       result.data || null,
//       result.error || null
//     );
//   } catch (err) {
//     return sendResponse(
//       res,
//       500,
//       false,
//       "Internal Server Error",
//       null,
//       err.message
//     );
//   }
// };

// module.exports = {
//   createOrder,
//   getAllOrders,
//   cancelOrder,
//   getOrderDetail,
//   markOrderPaid,
//   deleteOrder,
// };

const {
  createOrderService,
  getAllOrdersService,
  cancelOrderService,
  markOrderPaidService,
  getOrderDetailService,
  deleteOrderService,
} = require("../services/order.service");

const { sendResponse } = require("../utils/apiResponse");

// ✅ Create Order (POS)
const createOrder = async (req, res) => {
  try {
    const { productId, quantity, customerName, customerEmail, customerPhone } =
      req.body;

    console.log(customerEmail, "ashdgjadhaksdhsakjd");

    // ✅ NEW REQUIRED VALIDATIONS (based on updated schema)
    if (!productId) {
      return sendResponse(
        res,
        400,
        false,
        "Product id is required",
        null,
        "VALIDATION_ERROR"
      );
    }

    if (!customerName || customerName.trim() === "") {
      return sendResponse(
        res,
        400,
        false,
        "Customer name is required",
        null,
        "VALIDATION_ERROR"
      );
    }

    if (!customerEmail || customerEmail.trim() === "") {
      return sendResponse(
        res,
        400,
        false,
        "Customer email is required",
        null,
        "VALIDATION_ERROR"
      );
    }

    if (!customerPhone || customerPhone.trim() === "") {
      return sendResponse(
        res,
        400,
        false,
        "Customer phone is required",
        null,
        "VALIDATION_ERROR"
      );
    }

    if (!quantity || Number(quantity) < 1) {
      return sendResponse(
        res,
        400,
        false,
        "Quantity must be at least 1",
        null,
        "VALIDATION_ERROR"
      );
    }

    const result = await createOrderService(req.body);

    return sendResponse(
      res,
      result.statusCode,
      result.ok,
      result.message,
      result.data || null,
      result.error || null
    );
  } catch (err) {
    return sendResponse(
      res,
      500,
      false,
      "Internal Server Error",
      null,
      err.message
    );
  }
};

// ✅ Get All Orders
const getAllOrders = async (req, res) => {
  try {
    const result = await getAllOrdersService();

    return sendResponse(
      res,
      200,
      true,
      result.message,
      result.data || [],
      null
    );
  } catch (err) {
    return sendResponse(
      res,
      500,
      false,
      "Internal Server Error",
      null,
      err.message
    );
  }
};

// ✅ Cancel Order
const cancelOrder = async (req, res) => {
  try {
    const id = req.params.id?.trim();

    if (!id) {
      return sendResponse(
        res,
        400,
        false,
        "Order id is required",
        null,
        "VALIDATION_ERROR"
      );
    }

    const result = await cancelOrderService({ id });

    return sendResponse(
      res,
      result.statusCode,
      result.ok,
      result.message,
      result.data || null,
      result.error || null
    );
  } catch (err) {
    return sendResponse(
      res,
      500,
      false,
      "Internal Server Error",
      null,
      err.message
    );
  }
};

// ✅ Mark Paid
const markOrderPaid = async (req, res) => {
  try {
    const id = req.params.id?.trim();

    if (!id) {
      return sendResponse(
        res,
        400,
        false,
        "Order id is required",
        null,
        "VALIDATION_ERROR"
      );
    }

    const result = await markOrderPaidService({
      id,
      ...req.body,
    });

    return sendResponse(
      res,
      result.statusCode,
      result.ok,
      result.message,
      result.data || null,
      result.error || null
    );
  } catch (err) {
    return sendResponse(
      res,
      500,
      false,
      "Internal Server Error",
      null,
      err.message
    );
  }
};

// ✅ Get Order Detail
const getOrderDetail = async (req, res) => {
  try {
    const id = req.params.id?.trim();

    if (!id) {
      return sendResponse(
        res,
        400,
        false,
        "Order id is required",
        null,
        "VALIDATION_ERROR"
      );
    }

    const result = await getOrderDetailService({ id });

    return sendResponse(
      res,
      result.statusCode,
      result.ok,
      result.message,
      result.data || null,
      result.error || null
    );
  } catch (err) {
    return sendResponse(
      res,
      500,
      false,
      "Internal Server Error",
      null,
      err.message
    );
  }
};

// ✅ Delete Order
const deleteOrder = async (req, res) => {
  try {
    const id = req.params.id?.trim();

    if (!id) {
      return sendResponse(
        res,
        400,
        false,
        "Order id is required",
        null,
        "VALIDATION_ERROR"
      );
    }

    const result = await deleteOrderService({ id });

    return sendResponse(
      res,
      result.statusCode,
      result.ok,
      result.message,
      result.data || null,
      result.error || null
    );
  } catch (err) {
    return sendResponse(
      res,
      500,
      false,
      "Internal Server Error",
      null,
      err.message
    );
  }
};

module.exports = {
  createOrder,
  getAllOrders,
  cancelOrder,
  getOrderDetail,
  markOrderPaid,
  deleteOrder,
};
