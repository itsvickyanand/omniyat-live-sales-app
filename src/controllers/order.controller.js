const {
  createOrderService,
  getAllOrdersService,
  cancelOrderService,
  markOrderPaidService,
  getOrderDetailService,
  deleteOrderService,
} = require("../services/order.service");

const { sendResponse } = require("../utils/apiResponse");

/*
========================================
UTIL VALIDATORS
========================================
*/

const isValidUUID = (value) => {
  if (!value) return false;

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  return uuidRegex.test(value);
};

const isValidString = (value) => {
  return typeof value === "string" && value.trim() !== "";
};

const isValidNumber = (value) => {
  return value !== undefined && value !== null && !isNaN(value);
};

/*
========================================
CREATE ORDER
========================================
*/

const createOrder = async (req, res) => {
  try {
    const {
      productId,
      quantity,

      customerFirstName,
      customerLastName,
      customerEmail,

      customerCountryCode,
      customerPhoneNumber,

      customerCountry,
      customerState,
      customerCity,
      customerAddress,
    } = req.body;

    /*
    REQUIRED VALIDATIONS
    */

    if (!isValidUUID(productId)) {
      return sendResponse(
        res,
        400,
        false,
        "Valid productId is required",
        null,
        "VALIDATION_ERROR"
      );
    }

    if (!isValidString(customerFirstName)) {
      return sendResponse(
        res,
        400,
        false,
        "Customer first name is required",
        null,
        "VALIDATION_ERROR"
      );
    }

    // if (!isValidString(customerLastName)) {
    //   return sendResponse(
    //     res,
    //     400,
    //     false,
    //     "Customer last name is required",
    //     null,
    //     "VALIDATION_ERROR"
    //   );
    // }

    if (!isValidString(customerEmail)) {
      return sendResponse(
        res,
        400,
        false,
        "Customer email is required",
        null,
        "VALIDATION_ERROR"
      );
    }

    // if (!isValidString(customerCountryCode)) {
    //   return sendResponse(
    //     res,
    //     400,
    //     false,
    //     "Country code is required",
    //     null,
    //     "VALIDATION_ERROR"
    //   );
    // }

    // if (!isValidString(customerPhoneNumber)) {
    //   return sendResponse(
    //     res,
    //     400,
    //     false,
    //     "Phone number is required",
    //     null,
    //     "VALIDATION_ERROR"
    //   );
    // }

    // if (!isValidString(customerCountry)) {
    //   return sendResponse(
    //     res,
    //     400,
    //     false,
    //     "Country is required",
    //     null,
    //     "VALIDATION_ERROR"
    //   );
    // }

    // if (!isValidString(customerState)) {
    //   return sendResponse(
    //     res,
    //     400,
    //     false,
    //     "State is required",
    //     null,
    //     "VALIDATION_ERROR"
    //   );
    // }

    // if (!isValidString(customerCity)) {
    //   return sendResponse(
    //     res,
    //     400,
    //     false,
    //     "City is required",
    //     null,
    //     "VALIDATION_ERROR"
    //   );
    // }

    // if (!isValidString(customerAddress)) {
    //   return sendResponse(
    //     res,
    //     400,
    //     false,
    //     "Address is required",
    //     null,
    //     "VALIDATION_ERROR"
    //   );
    // }

    // if (!isValidNumber(quantity) || Number(quantity) < 1) {
    //   return sendResponse(
    //     res,
    //     400,
    //     false,
    //     "Quantity must be at least 1",
    //     null,
    //     "VALIDATION_ERROR"
    //   );
    // }

    /*
    CALL SERVICE
    */

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
    console.error("Create Order Error:", err);

    return sendResponse(
      res,
      500,
      false,
      "Internal server error",
      null,
      err.message
    );
  }
};

/*
========================================
GET ALL ORDERS
========================================
*/

const getAllOrders = async (req, res) => {
  try {
    const result = await getAllOrdersService();

    return sendResponse(
      res,
      result.statusCode || 200,
      result.ok,
      result.message,
      result.data || [],
      result.error || null
    );
  } catch (err) {
    console.error("Get Orders Error:", err);

    return sendResponse(
      res,
      500,
      false,
      "Internal server error",
      null,
      err.message
    );
  }
};

/*
========================================
GET ORDER DETAIL
========================================
*/

const getOrderDetail = async (req, res) => {
  try {
    const id = req.params.id;

    if (!isValidUUID(id)) {
      return sendResponse(
        res,
        400,
        false,
        "Valid order id is required",
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
    console.error("Get Order Detail Error:", err);

    return sendResponse(
      res,
      500,
      false,
      "Internal server error",
      null,
      err.message
    );
  }
};

/*
========================================
CANCEL ORDER
========================================
*/

const cancelOrder = async (req, res) => {
  try {
    const id = req.params.id;

    if (!isValidUUID(id)) {
      return sendResponse(
        res,
        400,
        false,
        "Valid order id is required",
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
    console.error("Cancel Order Error:", err);

    return sendResponse(
      res,
      500,
      false,
      "Internal server error",
      null,
      err.message
    );
  }
};

/*
========================================
MARK ORDER PAID
========================================
*/

const markOrderPaid = async (req, res) => {
  try {
    const id = req.params.id;

    if (!isValidUUID(id)) {
      return sendResponse(
        res,
        400,
        false,
        "Valid order id is required",
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
    console.error("Mark Paid Error:", err);

    return sendResponse(
      res,
      500,
      false,
      "Internal server error",
      null,
      err.message
    );
  }
};

/*
========================================
DELETE ORDER
========================================
*/

const deleteOrder = async (req, res) => {
  try {
    const id = req.params.id;

    if (!isValidUUID(id)) {
      return sendResponse(
        res,
        400,
        false,
        "Valid order id is required",
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
    console.error("Delete Order Error:", err);

    return sendResponse(
      res,
      500,
      false,
      "Internal server error",
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
