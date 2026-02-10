const express = require("express");
const {
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProducts,
  getProductDetail,
} = require("../controllers/product.controller");
const protectAdmin = require("../middlewares/protectAdmin");

const router = express.Router();

router.post("/create", protectAdmin, createProduct);
router.put("/update/:id", protectAdmin, updateProduct);
router.delete("/delete/:id", protectAdmin, deleteProduct);
router.get("/all", getAllProducts);
router.get("/:id", getProductDetail);

module.exports = router;
