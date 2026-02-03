const {
  createOrderService,
  getAllOrdersService,
  cancelOrderService,
  markOrderPaidService,
} = require("../services/order.service");

const { sendResponse } = require("../utils/apiResponse");

// ✅ Create Order (POS)
const createOrder = async (req, res) => {
  try {
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

    const result = await markOrderPaidService({ id, ...req.body });

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
  markOrderPaid,
};
