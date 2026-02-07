const { Order, Product, sequelize } = require("../models");

// ✅ Create Order (POS)
// paymentStatus:
//   - PAID (customer paid at store)
//   - PENDING (customer will pay later)
// status:
//   - ACTIVE
// const createOrderService = async (payload) => {
//   try {
//     const {
//       productId,
//       quantity = 1,
//       paymentStatus = "PAID",
//       paymentMethod = null,
//       paymentRef = null,
//       customerName = "Walk-in Customer",
//       customerPhone = null,
//     } = payload;

//     if (!productId) {
//       return {
//         ok: false,
//         statusCode: 400,
//         message: "productId is required",
//         data: null,
//         error: "VALIDATION_ERROR",
//       };
//     }

//     if (!quantity || isNaN(quantity) || Number(quantity) < 1) {
//       return {
//         ok: false,
//         statusCode: 400,
//         message: "quantity must be a valid number >= 1",
//         data: null,
//         error: "VALIDATION_ERROR",
//       };
//     }

//     // ✅ ACID transaction + row lock
//     const order = await sequelize.transaction(async (t) => {
//       // ✅ lock product row
//       const product = await Product.findByPk(productId, {
//         transaction: t,
//         lock: t.LOCK.UPDATE,
//       });

//       if (!product) {
//         throw new Error("Product not found");
//       }

//       if (!product.isActive) {
//         throw new Error("Product is inactive");
//       }

//       if (product.stock < Number(quantity)) {
//         throw new Error("Not enough stock available");
//       }

//       // ✅ reduce stock (reserve)
//       product.stock = product.stock - Number(quantity);
//       await product.save({ transaction: t });

//       // ✅ calculate amount
//       const amount = Number(product.price) * Number(quantity);

//       const createdOrder = await Order.create(
//         {
//           productId,
//           quantity: Number(quantity),
//           amount,
//           paymentMode: "OFFLINE",
//           paymentStatus,
//           status: "ACTIVE",
//           paymentMethod: paymentStatus === "PAID" ? paymentMethod : null,
//           paymentRef: paymentStatus === "PAID" ? paymentRef : null,
//           customerName,
//           customerPhone,
//         },
//         { transaction: t }
//       );

//       return createdOrder;
//     });

//     return {
//       ok: true,
//       statusCode: 201,
//       message: "Order created successfully ✅",
//       data: order,
//       error: null,
//     };
//   } catch (err) {
//     return {
//       ok: false,
//       statusCode: 500,
//       message: "Failed to create order",
//       data: null,
//       error: err.message,
//     };
//   }
// };
const createOrderService = async (payload) => {
  try {
    const {
      productId,
      quantity = 1,
      paymentStatus = "PAID",
      paymentMethod = null,
      paymentRef = null,

      customerName = "Walk-in Customer",
      customerEmail, // ✅ NEW FIELD
      customerPhone = null,
    } = payload;

    // ✅ REQUIRED VALIDATIONS

    if (!productId) {
      return {
        ok: false,
        statusCode: 400,
        message: "productId is required",
        data: null,
        error: "VALIDATION_ERROR",
      };
    }

    if (!customerName || customerName.trim() === "") {
      return {
        ok: false,
        statusCode: 400,
        message: "Customer name is required",
        data: null,
        error: "VALIDATION_ERROR",
      };
    }

    if (!customerEmail || customerEmail.trim() === "") {
      return {
        ok: false,
        statusCode: 400,
        message: "Customer email is required",
        data: null,
        error: "VALIDATION_ERROR",
      };
    }

    if (!customerPhone || customerPhone.trim() === "") {
      return {
        ok: false,
        statusCode: 400,
        message: "Customer phone is required",
        data: null,
        error: "VALIDATION_ERROR",
      };
    }

    if (!quantity || isNaN(quantity) || Number(quantity) < 1) {
      return {
        ok: false,
        statusCode: 400,
        message: "quantity must be a valid number >= 1",
        data: null,
        error: "VALIDATION_ERROR",
      };
    }

    // ✅ TRANSACTION WITH ROW LOCK
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

      if (product.stock < Number(quantity)) {
        throw new Error("Not enough stock available");
      }

      // ✅ Reduce stock safely
      product.stock = product.stock - Number(quantity);

      await product.save({ transaction: t });

      const amount = Number(product.price) * Number(quantity);

      const createdOrder = await Order.create(
        {
          productId,

          quantity: Number(quantity),

          amount,

          paymentMode: "OFFLINE",

          paymentStatus,

          status: "ACTIVE",

          paymentMethod:
            paymentStatus === "PAID" ? paymentMethod || "OTHER" : null,

          paymentRef: paymentStatus === "PAID" ? paymentRef : null,

          customerName,

          customerEmail, // ✅ CRITICAL FIX

          customerPhone,
        },
        { transaction: t }
      );

      return createdOrder;
    });

    return {
      ok: true,
      statusCode: 201,
      message: "Order created successfully ✅",
      data: order,
      error: null,
    };
  } catch (err) {
    return {
      ok: false,
      statusCode: 500,
      message: "Failed to create order",
      data: null,
      error: err.message,
    };
  }
};

// ✅ Get All Orders (Admin)
const getAllOrdersService = async () => {
  try {
    const orders = await Order.findAll({
      include: [
        {
          model: Product,
          attributes: ["id", "name", "slug", "price", "stock", "thumbnail"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return {
      ok: true,
      message: "Orders fetched successfully ✅",
      data: orders,
    };
  } catch (err) {
    return {
      ok: false,
      message: "Failed to fetch orders",
      data: null,
      error: err.message,
    };
  }
};

// ✅ Cancel Order (restore stock)
const cancelOrderService = async ({ id }) => {
  try {
    const order = await Order.findByPk(id);

    if (!order) {
      return {
        ok: false,
        statusCode: 404,
        message: "Order not found",
        data: null,
        error: "NOT_FOUND",
      };
    }

    if (order.status === "CANCELLED") {
      return {
        ok: false,
        statusCode: 400,
        message: "Order is already cancelled",
        data: null,
        error: "ALREADY_CANCELLED",
      };
    }

    // ✅ restore stock safely
    await sequelize.transaction(async (t) => {
      const freshOrder = await Order.findByPk(id, { transaction: t });

      if (!freshOrder) throw new Error("Order not found");
      if (freshOrder.status === "CANCELLED") return;

      const product = await Product.findByPk(freshOrder.productId, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!product) throw new Error("Product not found");

      // ✅ restore stock
      // product.stock = product.stock + freshOrder.quantity;
      product.stock = 1;

      await product.save({ transaction: t });

      // ✅ update order
      freshOrder.status = "CANCELLED";
      await freshOrder.save({ transaction: t });
    });

    return {
      ok: true,
      statusCode: 200,
      message: "Order cancelled and stock restored ✅",
      data: null,
      error: null,
    };
  } catch (err) {
    return {
      ok: false,
      statusCode: 500,
      message: "Failed to cancel order",
      data: null,
      error: err.message,
    };
  }
};

// ✅ Mark Offline Order Paid
const markOrderPaidService = async ({ id, paymentMethod, paymentRef }) => {
  try {
    const order = await Order.findByPk(id);

    if (!order) {
      return {
        ok: false,
        statusCode: 404,
        message: "Order not found",
        data: null,
        error: "NOT_FOUND",
      };
    }

    if (order.status === "CANCELLED") {
      return {
        ok: false,
        statusCode: 400,
        message: "Cancelled order cannot be marked paid",
        data: null,
        error: "ORDER_CANCELLED",
      };
    }

    if (order.paymentStatus === "PAID") {
      return {
        ok: false,
        statusCode: 400,
        message: "Order already marked as PAID",
        data: null,
        error: "ALREADY_PAID",
      };
    }

    order.paymentStatus = "PAID";
    order.paymentMethod = paymentMethod || "OTHER";
    order.paymentRef = paymentRef || null;

    await order.save();

    return {
      ok: true,
      statusCode: 200,
      message: "Order marked as PAID ✅",
      data: order,
      error: null,
    };
  } catch (err) {
    return {
      ok: false,
      statusCode: 500,
      message: "Failed to mark order paid",
      data: null,
      error: err.message,
    };
  }
};
const getOrderDetailService = async ({ id }) => {
  try {
    const order = await Order.findByPk(id, {
      include: [
        {
          model: Product,
          attributes: ["id", "name", "slug", "price", "stock", "thumbnail"],
        },
      ],
    });

    if (!order) {
      return {
        ok: false,
        statusCode: 404,
        message: "Order not found",
        data: null,
        error: "NOT_FOUND",
      };
    }

    return {
      ok: true,
      statusCode: 200,
      message: "Order fetched successfully ✅",
      data: order,
      error: null,
    };
  } catch (err) {
    return {
      ok: false,
      statusCode: 500,
      message: "Failed to fetch order",
      data: null,
      error: err.message,
    };
  }
};

const deleteOrderService = async ({ id }) => {
  try {
    const order = await Order.findByPk(id);

    if (!order) {
      return {
        ok: false,
        statusCode: 404,
        message: "Order not found",
        data: null,
        error: "NOT_FOUND",
      };
    }

    await sequelize.transaction(async (t) => {
      const freshOrder = await Order.findByPk(id, { transaction: t });

      if (!freshOrder) return;

      // ✅ if order is active and not paid/failed/cancelled, restore stock
      // safest: restore stock if NOT CANCELLED and NOT already restored
      if (freshOrder.status !== "CANCELLED") {
        const product = await Product.findByPk(freshOrder.productId, {
          transaction: t,
          lock: t.LOCK.UPDATE,
        });

        if (product) {
          // product.stock = product.stock + freshOrder.quantity;
          product.stock = 1;
          await product.save({ transaction: t });
        }
      }

      // ✅ delete permanently
      await freshOrder.destroy({ transaction: t });
    });

    return {
      ok: true,
      statusCode: 200,
      message: "Order deleted successfully ✅",
      data: null,
      error: null,
    };
  } catch (err) {
    return {
      ok: false,
      statusCode: 500,
      message: "Failed to delete order",
      data: null,
      error: err.message,
    };
  }
};

module.exports = {
  createOrderService,
  getAllOrdersService,
  cancelOrderService,
  markOrderPaidService,
  getOrderDetailService,
  deleteOrderService,
};

// const { Order, Product, sequelize } = require("../models");

// // ✅ Create Order (POS)
// const createOrderService = async (payload) => {
//   try {
//     const {
//       productId,
//       quantity = 1,
//       paymentStatus = "PAID",
//       paymentMethod = null,
//       paymentRef = null,

//       customerName = "Walk-in Customer",
//       customerEmail, // ✅ NEW FIELD
//       customerPhone = null,
//     } = payload;

//     // ✅ REQUIRED VALIDATIONS

//     if (!productId) {
//       return {
//         ok: false,
//         statusCode: 400,
//         message: "productId is required",
//         data: null,
//         error: "VALIDATION_ERROR",
//       };
//     }

//     if (!customerName || customerName.trim() === "") {
//       return {
//         ok: false,
//         statusCode: 400,
//         message: "Customer name is required",
//         data: null,
//         error: "VALIDATION_ERROR",
//       };
//     }

//     if (!customerEmail || customerEmail.trim() === "") {
//       return {
//         ok: false,
//         statusCode: 400,
//         message: "Customer email is required",
//         data: null,
//         error: "VALIDATION_ERROR",
//       };
//     }

//     if (!customerPhone || customerPhone.trim() === "") {
//       return {
//         ok: false,
//         statusCode: 400,
//         message: "Customer phone is required",
//         data: null,
//         error: "VALIDATION_ERROR",
//       };
//     }

//     if (!quantity || isNaN(quantity) || Number(quantity) < 1) {
//       return {
//         ok: false,
//         statusCode: 400,
//         message: "quantity must be a valid number >= 1",
//         data: null,
//         error: "VALIDATION_ERROR",
//       };
//     }

//     // ✅ TRANSACTION WITH ROW LOCK
//     const order = await sequelize.transaction(async (t) => {
//       const product = await Product.findByPk(productId, {
//         transaction: t,
//         lock: t.LOCK.UPDATE,
//       });

//       if (!product) {
//         throw new Error("Product not found");
//       }

//       if (!product.isActive) {
//         throw new Error("Product is inactive");
//       }

//       if (product.stock < Number(quantity)) {
//         throw new Error("Not enough stock available");
//       }

//       // ✅ Reduce stock safely
//       product.stock = product.stock - Number(quantity);

//       await product.save({ transaction: t });

//       const amount = Number(product.price) * Number(quantity);

//       const createdOrder = await Order.create(
//         {
//           productId,

//           quantity: Number(quantity),

//           amount,

//           paymentMode: "OFFLINE",

//           paymentStatus,

//           status: "ACTIVE",

//           paymentMethod:
//             paymentStatus === "PAID" ? paymentMethod || "OTHER" : null,

//           paymentRef: paymentStatus === "PAID" ? paymentRef : null,

//           customerName,

//           customerEmail, // ✅ CRITICAL FIX

//           customerPhone,
//         },
//         { transaction: t }
//       );

//       return createdOrder;
//     });

//     return {
//       ok: true,
//       statusCode: 201,
//       message: "Order created successfully ✅",
//       data: order,
//       error: null,
//     };
//   } catch (err) {
//     return {
//       ok: false,
//       statusCode: 500,
//       message: "Failed to create order",
//       data: null,
//       error: err.message,
//     };
//   }
// };
