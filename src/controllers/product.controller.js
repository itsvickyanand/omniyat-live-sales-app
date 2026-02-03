const {
  createProductService,
  updateProductService,
  deleteProductService,
  getAllProductsService,
  getProductDetailService,
} = require("../services/product.service");

const { sendResponse } = require("../utils/apiResponse");

// ✅ Create
const createProduct = async (req, res) => {
  try {
    const { name, slug, price, categoryId } = req.body;

    if (!categoryId) {
      return sendResponse(
        res,
        400,
        false,
        "categoryId is required",
        null,
        "VALIDATION_ERROR"
      );
    }

    // ✅ Basic validations (like Category)
    if (!name || name.trim() === "") {
      return sendResponse(
        res,
        400,
        false,
        "Product name is required",
        null,
        "VALIDATION_ERROR"
      );
    }

    if (!slug || slug.trim() === "") {
      return sendResponse(
        res,
        400,
        false,
        "Product slug is required",
        null,
        "VALIDATION_ERROR"
      );
    }

    if (price === undefined || price === null || isNaN(price)) {
      return sendResponse(
        res,
        400,
        false,
        "Product price is required and must be a number",
        null,
        "VALIDATION_ERROR"
      );
    }

    const result = await createProductService(req.body);

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
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return sendResponse(
        res,
        400,
        false,
        "Product id is required",
        null,
        "VALIDATION_ERROR"
      );
    }

    const result = await updateProductService({ id, ...req.body });

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
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return sendResponse(
        res,
        400,
        false,
        "Product id is required",
        null,
        "VALIDATION_ERROR"
      );
    }

    const result = await deleteProductService({ id });

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
const getAllProducts = async (req, res) => {
  try {
    const result = await getAllProductsService();

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
const getProductDetail = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return sendResponse(
        res,
        400,
        false,
        "Product id is required",
        null,
        "VALIDATION_ERROR"
      );
    }

    const result = await getProductDetailService({ id });

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
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProducts,
  getProductDetail,
};
