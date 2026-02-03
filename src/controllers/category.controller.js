const {
  createCategoryService,
  updateCategoryService,
  deleteCategoryService,
  getAllCategoriesService,
  getCategoryDetailService,
} = require("../services/category.service");

const { sendResponse } = require("../utils/apiResponse");

// ✅ Create
const createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim() === "") {
      return sendResponse(
        res,
        400,
        false,
        "Category name is required",
        null,
        "VALIDATION_ERROR"
      );
    }

    const result = await createCategoryService({ name });

    return sendResponse(
      res,
      result.statusCode,
      result.ok,
      result.message,
      result.data || null,
      result.error || null
    );
  } catch (err) {
    return sendResponse(
      res,
      500,
      false,
      "Internal Server Error",
      null,
      err.message
    );
  }
};

// ✅ Update
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, isActive } = req.body;

    if (!id) {
      return sendResponse(
        res,
        400,
        false,
        "Category id is required",
        null,
        "VALIDATION_ERROR"
      );
    }

    const result = await updateCategoryService({ id, name, isActive });

    return sendResponse(
      res,
      result.statusCode,
      result.ok,
      result.message,
      result.data || null,
      result.error || null
    );
  } catch (err) {
    return sendResponse(
      res,
      500,
      false,
      "Internal Server Error",
      null,
      err.message
    );
  }
};

// ✅ Delete
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return sendResponse(
        res,
        400,
        false,
        "Category id is required",
        null,
        "VALIDATION_ERROR"
      );
    }

    const result = await deleteCategoryService({ id });

    return sendResponse(
      res,
      result.statusCode,
      result.ok,
      result.message,
      result.data || null,
      result.error || null
    );
  } catch (err) {
    return sendResponse(
      res,
      500,
      false,
      "Internal Server Error",
      null,
      err.message
    );
  }
};

// ✅ Get All
const getAllCategories = async (req, res) => {
  try {
    const result = await getAllCategoriesService();

    return sendResponse(res, 200, true, result.message, result.data, null);
  } catch (err) {
    return sendResponse(
      res,
      500,
      false,
      "Internal Server Error",
      null,
      err.message
    );
  }
};

// ✅ Get Detail
const getCategoryDetail = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return sendResponse(
        res,
        400,
        false,
        "Category id is required",
        null,
        "VALIDATION_ERROR"
      );
    }

    const result = await getCategoryDetailService({ id });

    return sendResponse(
      res,
      result.statusCode,
      result.ok,
      result.message,
      result.data || null,
      result.error || null
    );
  } catch (err) {
    return sendResponse(
      res,
      500,
      false,
      "Internal Server Error",
      null,
      err.message
    );
  }
};

module.exports = {
  createCategory,
  updateCategory,
  deleteCategory,
  getAllCategories,
  getCategoryDetail,
};
