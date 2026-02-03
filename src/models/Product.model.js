const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Product = sequelize.define(
  "Product",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },

    categoryId: {
      type: DataTypes.UUID,
      allowNull: false,
      validate: {
        notNull: { msg: "categoryId is required" },
        notEmpty: { msg: "categoryId cannot be empty" },
      },
    },

    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: {
        notNull: { msg: "Product name is required" },
        notEmpty: { msg: "Product name cannot be empty" },
        len: {
          args: [2, 150],
          msg: "Product name must be between 2 and 150 characters",
        },
      },
    },

    slug: {
      type: DataTypes.STRING(200),
      allowNull: false,
      unique: true,
      validate: {
        notNull: { msg: "Product slug is required" },
        notEmpty: { msg: "Product slug cannot be empty" },
        len: {
          args: [2, 200],
          msg: "Product slug must be between 2 and 200 characters",
        },
        is: {
          args: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
          msg: "Slug must be lowercase and hyphen-separated (example: nike-air-max)",
        },
      },
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        // ✅ if provided, should not be empty spaces
        notEmpty: {
          msg: "Description cannot be empty (or send null)",
        },
      },
    },

    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        notNull: { msg: "Price is required" },
        isDecimal: { msg: "Price must be a decimal number" },
        min: {
          args: [0],
          msg: "Price cannot be negative",
        },
      },
    },

    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        notNull: { msg: "Stock is required" },
        isInt: { msg: "Stock must be an integer" },
        min: {
          args: [0],
          msg: "Stock cannot be negative",
        },
      },
    },

    // ✅ Product Images (multiple)
    images: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
      validate: {
        isArrayOfStrings(value) {
          if (!Array.isArray(value)) {
            throw new Error("Images must be an array");
          }
          for (const img of value) {
            if (typeof img !== "string" || img.trim().length === 0) {
              throw new Error("Each image must be a non-empty string");
            }
          }
        },
      },
    },

    // ✅ Optional: main thumbnail
    thumbnail: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        // if provided, should not be empty
        notEmpty: {
          msg: "Thumbnail cannot be empty (or send null)",
        },
      },
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      validate: {
        notNull: { msg: "isActive must be true or false" },
        isIn: {
          args: [[true, false]],
          msg: "isActive must be boolean",
        },
      },
    },
  },
  {
    tableName: "products",
    timestamps: true,
    indexes: [
      { unique: true, fields: ["slug"] },
      { fields: ["name"] },
      { fields: ["isActive"] },
      { fields: ["price"] },
    ],
  }
);

module.exports = Product;
