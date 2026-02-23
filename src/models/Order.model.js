const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Order = sequelize.define(
  "Order",
  {
    /*
    =====================================
    PRIMARY KEY
    =====================================
    */

    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },

    /*
    =====================================
    PRODUCT FOREIGN KEY
    =====================================
    */

    productId: {
      type: DataTypes.UUID,
      allowNull: false,

      references: {
        model: "products",
        key: "id",
      },

      onDelete: "RESTRICT",
      onUpdate: "CASCADE",

      validate: {
        notNull: { msg: "Product is required" },
        isUUID: {
          args: 4,
          msg: "Invalid product ID",
        },
      },
    },

    /*
    =====================================
    ORDER DETAILS
    =====================================
    */

    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,

      validate: {
        isInt: { msg: "Quantity must be integer" },
        min: { args: [1], msg: "Quantity must be at least 1" },
      },
    },

    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,

      validate: {
        isDecimal: true,
        min: 0,
      },
    },

    /*
    =====================================
    PAYMENT DETAILS
    =====================================
    */

    paymentMode: {
      type: DataTypes.ENUM("OFFLINE", "ONLINE"),
      allowNull: false,
      defaultValue: "OFFLINE",
    },

    paymentStatus: {
      type: DataTypes.ENUM(
        "CREATED",
        "PENDING",
        "AUTHORIZED",
        "PAID",
        "FAILED",
        "CANCELLED",
        "REFUNDED"
      ),
      allowNull: false,
      defaultValue: "CREATED",
    },

    paymentMethod: {
      type: DataTypes.ENUM("CASH", "UPI", "CARD", "OTHER"),
      allowNull: true,
    },
    reconciliationAttempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    lastReconciliationAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    gatewayOrderId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },

    // gatewayOrderId: {
    //   type: DataTypes.STRING,
    //   allowNull: true,
    // },

    // gatewayTrackingId: {
    //   type: DataTypes.STRING,
    //   allowNull: true,
    // },
    gatewayTrackingId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },

    paymentRef: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    /*
    =====================================
    ORDER STATUS
    =====================================
    */

    status: {
      type: DataTypes.ENUM("ACTIVE", "CANCELLED"),
      allowNull: false,
      defaultValue: "ACTIVE",
    },

    /*
    =====================================
    CUSTOMER DETAILS
    =====================================
    */

    customerFirstName: {
      type: DataTypes.STRING(120),
      allowNull: false,

      validate: {
        notNull: { msg: "First name required" },
        notEmpty: { msg: "First name cannot be empty" },
        len: {
          args: [2, 120],
          msg: "First name must be between 2 and 120 characters",
        },
      },
    },

    customerLastName: {
      type: DataTypes.STRING(120),
      allowNull: true,

      // validate: {
      //   notNull: { msg: "Last name required" },
      //   notEmpty: { msg: "Last name cannot be empty" },
      //   len: {
      //     args: [1, 120],
      //     msg: "Last name must be between 1 and 120 characters",
      //   },
      // },
    },

    customerEmail: {
      type: DataTypes.STRING(150),
      allowNull: false,

      validate: {
        isEmail: { msg: "Invalid email address" },
      },
    },

    /*
    =====================================
    PHONE DETAILS
    =====================================
    */

    customerCountryCode: {
      type: DataTypes.STRING(10),
      // allowNull: false,

      // validate: {
      //   notNull: { msg: "Country code required" },
      //   notEmpty: { msg: "Country code required" },
      // },
    },

    customerPhoneNumber: {
      type: DataTypes.STRING(20),
      // allowNull: false,

      // validate: {
      //   notNull: { msg: "Phone number required" },
      //   notEmpty: { msg: "Phone number required" },
      // },
    },

    /*
    =====================================
    ADDRESS DETAILS
    =====================================
    */

    customerCountry: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },

    customerState: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },

    customerCity: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },

    customerAddress: {
      type: DataTypes.STRING(500),
      allowNull: true,
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
      { fields: ["gatewayOrderId"], unique: true },
      { fields: ["reconciliationAttempts"] },
    ],
  }
);

module.exports = Order;
