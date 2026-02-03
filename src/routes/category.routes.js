const express = require("express");
const router = express.Router();

const {
  createCategory,
  updateCategory,
  deleteCategory,
  getAllCategories,
  getCategoryDetail,
} = require("../controllers/category.controller");

router.post("/create", createCategory);
router.put("/update/:id", updateCategory);
router.delete("/delete/:id", deleteCategory);
router.get("/all", getAllCategories);
router.get("/:id", getCategoryDetail);

module.exports = router;
