const express = require("express");
const router = express.Router();
const protectAdmin = require("../middlewares/protectAdmin");

const {
  createCategory,
  updateCategory,
  deleteCategory,
  getAllCategories,
  getCategoryDetail,
} = require("../controllers/category.controller");

router.post("/create", protectAdmin, createCategory);
router.put("/update/:id", protectAdmin, updateCategory);
router.delete("/delete/:id", protectAdmin, deleteCategory);
router.get("/all", getAllCategories);
router.get("/:id", getCategoryDetail);

module.exports = router;
