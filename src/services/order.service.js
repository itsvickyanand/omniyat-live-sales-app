const { Order, Product, sequelize } = require("../models");

/*
========================================
CREATE ORDER SERVICE
========================================
*/

const createOrderService = async (payload) => {
  try {
    const {
      productId,
      quantity = 1,

      paymentStatus = "PENDING",
      paymentMethod = null,
      paymentRef = null,

      customerFirstName,
      customerLastName,
      customerEmail,

      customerCountryCode,
      customerPhoneNumber,

      customerCountry,
      customerState,
      customerCity,
      customerAddress,
    } = payload;

    /*
    VALIDATIONS
    */

    if (!productId) {
      return errorResponse("productId is required");
    }

    if (!customerFirstName) {
      return errorResponse("customerFirstName is required");
    }

    // if (!customerLastName) {
    //   return errorResponse("customerLastName is required");
    // }

    if (!customerEmail) {
      return errorResponse("customerEmail is required");
    }

    // if (!customerCountryCode) {
    //   return errorResponse("customerCountryCode is required");
    // }

    // if (!customerPhoneNumber) {
    //   return errorResponse("customerPhoneNumber is required");
    // }

    // if (!customerCountry) {
    //   return errorResponse("customerCountry is required");
    // }

    // if (!customerState) {
    //   return errorResponse("customerState is required");
    // }

    // if (!customerCity) {
    //   return errorResponse("customerCity is required");
    // }

    // if (!customerAddress) {
    //   return errorResponse("customerAddress is required");
    // }

    if (!quantity || Number(quantity) < 1) {
      return errorResponse("quantity must be >= 1");
    }

    /*
    TRANSACTION (CRITICAL FOR PRODUCTION)
    */

    const order = await sequelize.transaction(async (t) => {
      const product = await Product.findByPk(productId, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!product) {
        throw new Error("Product not found");
      }

      if (!product.isActive) {
        throw new Error("Product is inactive");
      }

      if (product.stock < quantity) {
        throw new Error("Insufficient stock");
      }

      /*
      REDUCE STOCK SAFELY
      */

      product.stock -= quantity;

      await product.save({ transaction: t });

      /*
      CALCULATE AMOUNT
      */

      const amount = Number(product.price) * Number(quantity);

      /*
      CREATE ORDER
      */

      const createdOrder = await Order.create(
        {
          productId,

          quantity,

          amount,

          paymentMode: "OFFLINE",

          paymentStatus,

          status: "ACTIVE",

          paymentMethod:
            paymentStatus === "PAID" ? paymentMethod || "OTHER" : null,

          paymentRef: paymentStatus === "PAID" ? paymentRef || null : null,

          customerFirstName,
          customerLastName,
          customerEmail,

          customerCountryCode,
          customerPhoneNumber,

          customerCountry,
          customerState,
          customerCity,
          customerAddress,
        },
        { transaction: t }
      );

      return createdOrder;
    });

    return successResponse(201, "Order created successfully ✅", order);
  } catch (err) {
    return internalError(err);
  }
};

/*
========================================
GET ALL ORDERS
========================================
*/

const getAllOrdersService = async () => {
  try {
    // const orders = await Order.findAll({
    //   include: [
    //     {
    //       model: Product,
    //       attributes: ["id", "name", "slug", "price", "thumbnail"],
    //     },
    //   ],
    //   order: [["createdAt", "DESC"]],
    // });
    const orders = await Order.findAll({
      include: [
        {
          model: Product,
          as: "product",
          attributes: ["id", "name", "price", "thumbnail"],
        },
      ],
    });

    return successResponse(200, "Orders fetched successfully", orders);
  } catch (err) {
    return internalError(err);
  }
};

/*
========================================
CANCEL ORDER SERVICE
========================================
*/

const cancelOrderService = async ({ id }) => {
  try {
    const order = await Order.findByPk(id);

    if (!order) {
      return errorResponse("Order not found", 404, "NOT_FOUND");
    }

    if (order.status === "CANCELLED") {
      return errorResponse("Order already cancelled", 400, "ALREADY_CANCELLED");
    }
    // if (order.status === "PAID") {
    //   return errorResponse("Cannot cancel paid Orders", 400, "PAID_ORDER");
    // }

    await sequelize.transaction(async (t) => {
      const freshOrder = await Order.findByPk(id, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      const product = await Product.findByPk(freshOrder.productId, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      /*
      RESTORE STOCK CORRECTLY
      */

      // product.stock += freshOrder.quantity;
      product.stock = 1;

      await product.save({ transaction: t });

      freshOrder.status = "CANCELLED";

      await freshOrder.save({ transaction: t });
    });

    return successResponse(200, "Order cancelled successfully");
  } catch (err) {
    return internalError(err);
  }
};

/*
========================================
MARK ORDER PAID
========================================
*/

const markOrderPaidService = async ({ id, paymentMethod, paymentRef }) => {
  try {
    const order = await Order.findByPk(id);

    if (!order) {
      return errorResponse("Order not found", 404);
    }

    if (order.status === "CANCELLED") {
      return errorResponse("Cancelled order cannot be paid");
    }

    if (order.paymentStatus === "PAID") {
      return errorResponse("Already marked paid");
    }

    order.paymentStatus = "PAID";
    order.paymentMethod = paymentMethod || "OTHER";
    order.paymentRef = paymentRef || null;

    await order.save();

    return successResponse(200, "Order marked as paid", order);
  } catch (err) {
    return internalError(err);
  }
};

/*
========================================
GET ORDER DETAIL
========================================
*/

const getOrderDetailService = async ({ id }) => {
  try {
    const order = await Order.findByPk(id, {
      include: [
        {
          model: Product,
          as: "product",
          attributes: ["id", "name", "price", "thumbnail"],
        },
      ],
    });

    if (!order) {
      return errorResponse("Order not found", 404);
    }

    return successResponse(200, "Order fetched", order);
  } catch (err) {
    return internalError(err);
  }
};

/*
========================================
DELETE ORDER SERVICE
========================================
*/

const deleteOrderService = async ({ id }) => {
  try {
    await sequelize.transaction(async (t) => {
      const order = await Order.findByPk(id, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!order) {
        throw new Error("Order not found");
      }

      /*
      RESTORE STOCK IF ACTIVE
      */

      // if (order.status !== "CANCELLED") {
      //   const product = await Product.findByPk(order.productId, {
      //     transaction: t,
      //     lock: t.LOCK.UPDATE,
      //   });

      //   if (product) {
      //     // product.stock += order.quantity;
      //     product.stock = 1;
      //     await product.save({ transaction: t });
      //   }
      // }

      await order.destroy({ transaction: t });
    });

    return successResponse(200, "Order deleted successfully");
  } catch (err) {
    return internalError(err);
  }
};

/*
========================================
COMMON RESPONSE HELPERS
========================================
*/

const successResponse = (statusCode, message, data = null) => ({
  ok: true,
  statusCode,
  message,
  data,
  error: null,
});

const errorResponse = (
  message,
  statusCode = 400,
  error = "VALIDATION_ERROR"
) => ({
  ok: false,
  statusCode,
  message,
  data: null,
  error,
});

const internalError = (err) => ({
  ok: false,
  statusCode: 500,
  message: "Internal server error",
  data: null,
  error: err.message,
});

module.exports = {
  createOrderService,
  getAllOrdersService,
  cancelOrderService,
  markOrderPaidService,
  getOrderDetailService,
  deleteOrderService,
};
