const { Product, Category } = require("../models");

// ✅ Create
const createProductService = async (payload) => {
  try {
    // ✅ categoryId required
    if (!payload.categoryId) {
      return {
        ok: false,
        statusCode: 400,
        message: "categoryId is required",
        data: null,
        error: "VALIDATION_ERROR",
      };
    }

    // ✅ validate category exists
    const category = await Category.findByPk(payload.categoryId);
    if (!category) {
      return {
        ok: false,
        statusCode: 404,
        message: "Category not found",
        data: null,
        error: "CATEGORY_NOT_FOUND",
      };
    }

    // ✅ slug unique check
    const existingSlug = await Product.findOne({
      where: { slug: payload.slug },
    });

    if (existingSlug) {
      return {
        ok: false,
        statusCode: 409,
        message: "Product with this slug already exists",
        data: null,
        error: "DUPLICATE_SLUG",
      };
    }

    const product = await Product.create(payload);

    return {
      ok: true,
      statusCode: 201,
      message: "Product created successfully ✅",
      data: product,
      error: null,
    };
  } catch (err) {
    return {
      ok: false,
      statusCode: 500,
      message: "Failed to create product",
      data: null,
      error: err.message,
    };
  }
};

// ✅ Update
const updateProductService = async ({ id, ...payload }) => {
  try {
    const product = await Product.findByPk(id);

    if (!product) {
      return {
        ok: false,
        statusCode: 404,
        message: "Product not found",
        data: null,
        error: "NOT_FOUND",
      };
    }

    // ✅ handle categoryId update check
    if (payload.categoryId && payload.categoryId !== product.categoryId) {
      const category = await Category.findByPk(payload.categoryId);

      if (!category) {
        return {
          ok: false,
          statusCode: 404,
          message: "Category not found",
          data: null,
          error: "CATEGORY_NOT_FOUND",
        };
      }
    }

    // ✅ handle slug update uniqueness
    if (payload.slug && payload.slug !== product.slug) {
      const existingSlug = await Product.findOne({
        where: { slug: payload.slug },
      });

      if (existingSlug) {
        return {
          ok: false,
          statusCode: 409,
          message: "Product with this slug already exists",
          data: null,
          error: "DUPLICATE_SLUG",
        };
      }
    }

    await product.update(payload);

    return {
      ok: true,
      statusCode: 200,
      message: "Product updated successfully ✅",
      data: product,
      error: null,
    };
  } catch (err) {
    return {
      ok: false,
      statusCode: 500,
      message: "Failed to update product",
      data: null,
      error: err.message,
    };
  }
};

// ✅ Delete
const deleteProductService = async ({ id }) => {
  try {
    const product = await Product.findByPk(id);

    if (!product) {
      return {
        ok: false,
        statusCode: 404,
        message: "Product not found",
        data: null,
        error: "NOT_FOUND",
      };
    }

    await product.destroy();

    return {
      ok: true,
      statusCode: 200,
      message: "Product deleted successfully ✅",
      data: null,
      error: null,
    };
  } catch (err) {
    return {
      ok: false,
      statusCode: 500,
      message: "Failed to delete product",
      data: null,
      error: err.message,
    };
  }
};

// ✅ Get All (include category)
const getAllProductsService = async () => {
  try {
    const products = await Product.findAll({
      include: [
        {
          model: Category,
          attributes: ["id", "name", "slug"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return {
      ok: true,
      message: "Products fetched successfully ✅",
      data: products,
    };
  } catch (err) {
    return {
      ok: false,
      message: "Failed to fetch products",
      data: null,
      error: err.message,
    };
  }
};

// ✅ Get Detail (include category)
const getProductDetailService = async ({ id }) => {
  try {
    const product = await Product.findByPk(id, {
      include: [
        {
          model: Category,
          attributes: ["id", "name", "slug"],
        },
      ],
    });

    if (!product) {
      return {
        ok: false,
        statusCode: 404,
        message: "Product not found",
        data: null,
        error: "NOT_FOUND",
      };
    }

    return {
      ok: true,
      statusCode: 200,
      message: "Product fetched successfully ✅",
      data: product,
      error: null,
    };
  } catch (err) {
    return {
      ok: false,
      statusCode: 500,
      message: "Failed to fetch product",
      data: null,
      error: err.message,
    };
  }
};

module.exports = {
  createProductService,
  updateProductService,
  deleteProductService,
  getAllProductsService,
  getProductDetailService,
};
