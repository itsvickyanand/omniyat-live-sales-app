const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Category = sequelize.define(
  "Category",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },

    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        notNull: {
          msg: "Category name is required",
        },
        notEmpty: {
          msg: "Category name cannot be empty",
        },
        len: {
          args: [2, 100],
          msg: "Category name must be between 2 and 100 characters",
        },
      },
    },

    slug: {
      type: DataTypes.STRING(120),
      allowNull: false,
      unique: true,
      validate: {
        notNull: {
          msg: "Category slug is required",
        },
        notEmpty: {
          msg: "Category slug cannot be empty",
        },
        len: {
          args: [2, 120],
          msg: "Category slug must be between 2 and 120 characters",
        },
        is: {
          args: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
          msg: "Slug must be lowercase and hyphen-separated (example: men-fashion)",
        },
      },
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      validate: {
        notNull: {
          msg: "isActive must be true or false",
        },
        isIn: {
          args: [[true, false]],
          msg: "isActive must be boolean",
        },
      },
    },
  },
  {
    tableName: "categories",
    timestamps: true,

    // ✅ Adds DB indexes for faster search + uniqueness
    indexes: [
      { unique: true, fields: ["name"] },
      { unique: true, fields: ["slug"] },
    ],
  }
);

module.exports = Category;
