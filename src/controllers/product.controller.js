const {
  createProductService,
  updateProductService,
  deleteProductService,
  getAllProductsService,
  getProductDetailService,
} = require("../services/product.service");

const { sendResponse } = require("../utils/apiResponse");

/*
========================================
UTIL VALIDATORS
========================================
*/

const isValidUUID = (value) => {
  if (!value) return false;

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  return uuidRegex.test(value);
};

const isValidNumber = (value) => {
  return value !== undefined && value !== null && !isNaN(value);
};

/*
========================================
CREATE PRODUCT
========================================
*/

const createProduct = async (req, res) => {
  try {
    const { categoryId, artistId, name, price, stock, images } = req.body;

    /*
    REQUIRED FIELD VALIDATION
    */

    if (!isValidUUID(categoryId)) {
      return sendResponse(
        res,
        400,
        false,
        "Valid categoryId is required",
        null,
        "VALIDATION_ERROR"
      );
    }

    if (!isValidUUID(artistId)) {
      return sendResponse(
        res,
        400,
        false,
        "Valid artistId is required",
        null,
        "VALIDATION_ERROR"
      );
    }

    if (!name || !name.trim()) {
      return sendResponse(
        res,
        400,
        false,
        "Product name is required",
        null,
        "VALIDATION_ERROR"
      );
    }

    if (!isValidNumber(price)) {
      return sendResponse(
        res,
        400,
        false,
        "Valid price is required",
        null,
        "VALIDATION_ERROR"
      );
    }

    if (!isValidNumber(stock)) {
      return sendResponse(
        res,
        400,
        false,
        "Valid stock is required",
        null,
        "VALIDATION_ERROR"
      );
    }

    if (!Array.isArray(images) || images.length === 0) {
      return sendResponse(
        res,
        400,
        false,
        "At least one image is required",
        null,
        "VALIDATION_ERROR"
      );
    }

    /*
    CALL SERVICE
    */

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
    console.error("Create Product Error:", err);

    return sendResponse(
      res,
      500,
      false,
      "Internal server error",
      null,
      err.message
    );
  }
};

/*
========================================
UPDATE PRODUCT
========================================
*/

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return sendResponse(
        res,
        400,
        false,
        "Valid product id is required",
        null,
        "VALIDATION_ERROR"
      );
    }

    /*
    OPTIONAL VALIDATIONS
    */

    if (req.body.categoryId && !isValidUUID(req.body.categoryId)) {
      return sendResponse(
        res,
        400,
        false,
        "Invalid categoryId",
        null,
        "VALIDATION_ERROR"
      );
    }

    if (req.body.artistId && !isValidUUID(req.body.artistId)) {
      return sendResponse(
        res,
        400,
        false,
        "Invalid artistId",
        null,
        "VALIDATION_ERROR"
      );
    }

    if (req.body.price !== undefined && !isValidNumber(req.body.price)) {
      return sendResponse(
        res,
        400,
        false,
        "Price must be a valid number",
        null,
        "VALIDATION_ERROR"
      );
    }

    if (req.body.stock !== undefined && !isValidNumber(req.body.stock)) {
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
      !isValidNumber(req.body.donationPercentage)
    ) {
      return sendResponse(
        res,
        400,
        false,
        "Donation percentage must be a valid number",
        null,
        "VALIDATION_ERROR"
      );
    }

    /*
    CALL SERVICE
    */

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
    console.error("Update Product Error:", err);

    return sendResponse(
      res,
      500,
      false,
      "Internal server error",
      null,
      err.message
    );
  }
};

/*
========================================
DELETE PRODUCT
========================================
*/

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return sendResponse(
        res,
        400,
        false,
        "Valid product id is required",
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
    console.error("Delete Product Error:", err);

    return sendResponse(
      res,
      500,
      false,
      "Internal server error",
      null,
      err.message
    );
  }
};

/*
========================================
GET ALL PRODUCTS
========================================
*/

const getAllProducts = async (req, res) => {
  try {
    const result = await getAllProductsService();

    return sendResponse(
      res,
      result.statusCode || 200,
      result.ok,
      result.message,
      result.data,
      result.error || null
    );
  } catch (err) {
    console.error("Get Products Error:", err);

    return sendResponse(
      res,
      500,
      false,
      "Internal server error",
      null,
      err.message
    );
  }
};

/*
========================================
GET PRODUCT DETAIL
========================================
*/

const getProductDetail = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return sendResponse(
        res,
        400,
        false,
        "Valid product id is required",
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
    console.error("Get Product Detail Error:", err);

    return sendResponse(
      res,
      500,
      false,
      "Internal server error",
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
