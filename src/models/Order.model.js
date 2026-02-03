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
      type: DataTypes.ENUM("OFFLINE"),
      allowNull: false,
      defaultValue: "OFFLINE",
    },

    paymentStatus: {
      type: DataTypes.ENUM("PAID", "PENDING"),
      allowNull: false,
      defaultValue: "PAID",
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

    paymentRef: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    customerName: {
      type: DataTypes.STRING(120),
      allowNull: true,
      defaultValue: "Walk-in Customer",
    },

    customerPhone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
  },
  {
    tableName: "orders",
    timestamps: true,
    indexes: [
      { fields: ["productId"] },
      { fields: ["paymentStatus"] },
      { fields: ["status"] },
      { fields: ["createdAt"] },
    ],
  }
);

module.exports = Order;
