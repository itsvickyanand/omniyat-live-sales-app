const {
  createProductService,
  updateProductService,
  deleteProductService,
  getAllProductsService,
  getProductDetailService,
} = require("../services/product.service");

const { sendResponse } = require("../utils/apiResponse");

// ✅ Create Product
const createProduct = async (req, res) => {
  try {
    const { categoryId, artistName, name, slug, price, stock, images } =
      req.body;

    // ✅ Required validations (based on updated schema)

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

    if (!artistName || artistName.trim() === "") {
      return sendResponse(
        res,
        400,
        false,
        "Artist name is required",
        null,
        "VALIDATION_ERROR"
      );
    }

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

    if (stock === undefined || stock === null || isNaN(stock)) {
      return sendResponse(
        res,
        400,
        false,
        "Product stock is required and must be a number",
        null,
        "VALIDATION_ERROR"
      );
    }

    if (!Array.isArray(images) || images.length === 0) {
      return sendResponse(
        res,
        400,
        false,
        "At least one product image is required",
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

// ✅ Update Product
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

    // Optional validations if fields provided
    if (req.body.price !== undefined && isNaN(req.body.price)) {
      return sendResponse(
        res,
        400,
        false,
        "Price must be a valid number",
        null,
        "VALIDATION_ERROR"
      );
    }

    if (req.body.stock !== undefined && isNaN(req.body.stock)) {
      return sendResponse(
        res,
        400,
        false,
        "Stock must be a valid number",
        null,
        "VALIDATION_ERROR"
      );
    }

    if (
      req.body.donationPercentage !== undefined &&
      isNaN(req.body.donationPercentage)
    ) {
      return sendResponse(
        res,
        400,
        false,
        "Donation percentage must be a number",
        null,
        "VALIDATION_ERROR"
      );
    }

    const result = await updateProductService({
      id,
      ...req.body,
    });

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

// ✅ Delete Product
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

// ✅ Get All Products
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

// ✅ Get Product Detail
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
