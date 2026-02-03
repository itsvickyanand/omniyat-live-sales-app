const express = require("express");
const {
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProducts,
  getProductDetail,
} = require("../controllers/product.controller");

const router = express.Router();

router.post("/create", createProduct);
router.put("/update/:id", updateProduct);
router.delete("/delete/:id", deleteProduct);
router.get("/all", getAllProducts);
router.get("/:id", getProductDetail);

module.exports = router;
