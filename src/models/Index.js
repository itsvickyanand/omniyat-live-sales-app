const sequelize = require("../config/db");

const Category = require("./Category.model");
const Product = require("./Product.model");
const Order = require("./Order.model");
const AdminSession = require("./AdminSession");

// ✅ Relations
Category.hasMany(Product, {
  foreignKey: "categoryId",
  onDelete: "CASCADE",
});

Product.belongsTo(Category, {
  foreignKey: "categoryId",
});

// ✅ Order Relations
Product.hasMany(Order, {
  foreignKey: "productId",
  onDelete: "CASCADE",
});

Order.belongsTo(Product, {
  foreignKey: "productId",
});

const db = {
  sequelize,
  Category,
  Product,
  Order,
  AdminSession,
};

module.exports = db;
