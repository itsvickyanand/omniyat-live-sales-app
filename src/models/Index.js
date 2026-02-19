const sequelize = require("../config/db");

const Category = require("./Category.model");
const Product = require("./Product.model");
const Order = require("./Order.model");
const AdminSession = require("./AdminSession");
const Artist = require("./artist.model");

/*
========================================
CATEGORY ↔ PRODUCT RELATION
========================================
One Category → Many Products
*/
Category.hasMany(Product, {
  foreignKey: "categoryId",
  as: "products",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE",
});

Product.belongsTo(Category, {
  foreignKey: "categoryId",
  as: "category",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE",
});

/*
========================================
ARTIST ↔ PRODUCT RELATION
========================================
One Artist → Many Products
*/
Artist.hasMany(Product, {
  foreignKey: "artistId",
  as: "products",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE",
});

Product.belongsTo(Artist, {
  foreignKey: "artistId",
  as: "artist",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE",
});

/*
========================================
PRODUCT ↔ ORDER RELATION
========================================
One Product → Many Orders
*/
Product.hasMany(Order, {
  foreignKey: "productId",
  as: "orders",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE",
});

Order.belongsTo(Product, {
  foreignKey: "productId",
  as: "product",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE",
});

/*
========================================
EXPORT DB OBJECT
========================================
*/
const db = {
  sequelize,
  Category,
  Product,
  Artist,
  Order,
  AdminSession,
};

module.exports = db;
