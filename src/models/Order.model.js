// const { DataTypes } = require("sequelize");
// const sequelize = require("../config/db");

// const Order = sequelize.define(
//   "Order",
//   {
//     id: {
//       type: DataTypes.UUID,
//       defaultValue: DataTypes.UUIDV4,
//       primaryKey: true,
//       allowNull: false,
//     },

//     productId: {
//       type: DataTypes.UUID,
//       allowNull: false,
//     },

//     quantity: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//       defaultValue: 1,
//       validate: {
//         isInt: { msg: "Quantity must be an integer" },
//         min: { args: [1], msg: "Quantity must be at least 1" },
//       },
//     },

//     amount: {
//       type: DataTypes.DECIMAL(10, 2),
//       allowNull: false,
//       defaultValue: 0,
//       validate: {
//         isDecimal: { msg: "Amount must be a decimal number" },
//         min: { args: [0], msg: "Amount cannot be negative" },
//       },
//     },

//     paymentMode: {
//       type: DataTypes.ENUM("OFFLINE", "ONLINE"),
//       allowNull: false,
//       defaultValue: "OFFLINE",
//     },

//     paymentStatus: {
//       type: DataTypes.ENUM("PAID", "PENDING", "FAILED"),
//       allowNull: false,
//       defaultValue: "PAID",
//     },

//     status: {
//       type: DataTypes.ENUM("ACTIVE", "CANCELLED"),
//       allowNull: false,
//       defaultValue: "ACTIVE",
//     },

//     paymentMethod: {
//       type: DataTypes.ENUM("CASH", "UPI", "CARD", "OTHER"),
//       allowNull: true,
//     },

//     gatewayOrderId: {
//       type: DataTypes.STRING,
//       allowNull: true,
//     },

//     gatewayTrackingId: {
//       type: DataTypes.STRING,
//       allowNull: true,
//     },

//     paymentRef: {
//       type: DataTypes.STRING,
//       allowNull: true,
//     },

//     customerName: {
//       type: DataTypes.STRING(120),
//       allowNull: true,
//       defaultValue: "Walk-in Customer",
//     },

//     customerPhone: {
//       type: DataTypes.STRING(20),
//       allowNull: true,
//     },
//   },
//   {
//     tableName: "orders",
//     timestamps: true,
//     indexes: [
//       { fields: ["productId"] },
//       { fields: ["paymentStatus"] },
//       { fields: ["status"] },
//       { fields: ["createdAt"] },
//     ],
//   }
// );

// module.exports = Order;

const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Order = sequelize.define(
  "Order",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },

    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      validate: {
        notNull: { msg: "Product ID is required" },
        notEmpty: { msg: "Product ID cannot be empty" },
      },
    },

    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        isInt: { msg: "Quantity must be an integer" },
        min: { args: [1], msg: "Quantity must be at least 1" },
      },
    },

    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        isDecimal: { msg: "Amount must be a decimal number" },
        min: { args: [0], msg: "Amount cannot be negative" },
      },
    },

    paymentMode: {
      type: DataTypes.ENUM("OFFLINE", "ONLINE"),
      allowNull: false,
      defaultValue: "OFFLINE",
    },

    paymentStatus: {
      paymentStatus: {
        type: DataTypes.ENUM(
          "CREATED", // order created
          "PENDING", // payment started
          "AUTHORIZED", // authorized but not captured
          "PAID", // success
          "FAILED", // failed
          "CANCELLED", // user cancelled
          "REFUNDED" // refunded
        ),
        defaultValue: "CREATED",
      },
      allowNull: false,
      defaultValue: "PENDING",
    },

    status: {
      type: DataTypes.ENUM("ACTIVE", "CANCELLED"),
      allowNull: false,
      defaultValue: "ACTIVE",
    },

    paymentMethod: {
      type: DataTypes.ENUM("CASH", "UPI", "CARD", "OTHER"),
      allowNull: true,
    },

    gatewayOrderId: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    gatewayTrackingId: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    paymentRef: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // ✅ REQUIRED
    customerName: {
      type: DataTypes.STRING(120),
      allowNull: false,
      validate: {
        notNull: { msg: "Customer name is required" },
        notEmpty: { msg: "Customer name cannot be empty" },
        len: {
          args: [2, 120],
          msg: "Customer name must be between 2 and 120 characters",
        },
      },
    },

    // ✅ NEW REQUIRED FIELD
    customerEmail: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: {
        notNull: { msg: "Customer email is required" },
        notEmpty: { msg: "Customer email cannot be empty" },
        isEmail: { msg: "Must be a valid email address" },
      },
    },

    // ✅ REQUIRED
    customerPhone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        notNull: { msg: "Customer phone is required" },
        notEmpty: { msg: "Customer phone cannot be empty" },
        len: {
          args: [6, 20],
          msg: "Customer phone must be between 6 and 20 digits",
        },
      },
    },
  },
  {
    tableName: "orders",

    timestamps: true,

    indexes: [
      { fields: ["productId"] },
      { fields: ["customerEmail"] },
      { fields: ["paymentStatus"] },
      { fields: ["status"] },
      { fields: ["createdAt"] },
    ],
  }
);

module.exports = Order;
