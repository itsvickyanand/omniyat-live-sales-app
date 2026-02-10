const { Product, Category } = require("../models");

// ✅ Create Product Service
const createProductService = async (payload) => {
  try {
    const {
      categoryId,
      artistName,
      name,
      slug,
      price,
      stock = 0,

      description = null,
      size = null,
      weight = null,
      donationPercentage = null,
      deliveryInfo = null,
      address = null,
      installationInstructions = null,

      images = [],
      thumbnail = null,

      isActive = true,
    } = payload;

    // ✅ REQUIRED VALIDATIONS

    if (!categoryId) {
      return {
        ok: false,
        statusCode: 400,
        message: "categoryId is required",
        data: null,
        error: "VALIDATION_ERROR",
      };
    }

    if (!artistName || artistName.trim() === "") {
      return {
        ok: false,
        statusCode: 400,
        message: "artistName is required",
        data: null,
        error: "VALIDATION_ERROR",
      };
    }

    if (!name || name.trim() === "") {
      return {
        ok: false,
        statusCode: 400,
        message: "Product name is required",
        data: null,
        error: "VALIDATION_ERROR",
      };
    }

    if (!slug || slug.trim() === "") {
      return {
        ok: false,
        statusCode: 400,
        message: "Product slug is required",
        data: null,
        error: "VALIDATION_ERROR",
      };
    }

    if (price === undefined || price === null || isNaN(price)) {
      return {
        ok: false,
        statusCode: 400,
        message: "Valid price is required",
        data: null,
        error: "VALIDATION_ERROR",
      };
    }

    // ✅ Validate category exists

    const category = await Category.findByPk(categoryId);

    if (!category) {
      return {
        ok: false,
        statusCode: 404,
        message: "Category not found",
        data: null,
        error: "CATEGORY_NOT_FOUND",
      };
    }

    // ✅ Check slug uniqueness

    const existingSlug = await Product.findOne({
      where: { slug },
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

    // ✅ Create product safely

    const product = await Product.create({
      categoryId,
      artistName,
      name,
      slug,

      price: Number(price),
      stock: Number(stock),

      description,
      size,
      weight,
      donationPercentage,
      deliveryInfo,
      address,
      installationInstructions,

      images,
      thumbnail,

      isActive,
    });

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

// ✅ Update Product Service

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

    // ✅ Category validation

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

    // ✅ Slug uniqueness validation

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

    // ✅ Safely update fields

    await product.update({
      categoryId: payload.categoryId ?? product.categoryId,

      artistName: payload.artistName ?? product.artistName,

      name: payload.name ?? product.name,

      slug: payload.slug ?? product.slug,

      price:
        payload.price !== undefined ? Number(payload.price) : product.price,

      stock:
        payload.stock !== undefined ? Number(payload.stock) : product.stock,

      description: payload.description ?? product.description,

      size: payload.size ?? product.size,

      weight: payload.weight ?? product.weight,

      donationPercentage:
        payload.donationPercentage ?? product.donationPercentage,

      deliveryInfo: payload.deliveryInfo ?? product.deliveryInfo,

      address: payload.address ?? product.address,

      installationInstructions:
        payload.installationInstructions ?? product.installationInstructions,

      images: payload.images ?? product.images,

      thumbnail: payload.thumbnail ?? product.thumbnail,

      isActive: payload.isActive ?? product.isActive,
    });

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

// ✅ Delete Product Service (unchanged)

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

// ✅ Get All Products

const getAllProductsService = async () => {
  try {
    const products = await Product.findAll({
      include: [
        {
          model: Category,
          attributes: ["id", "name"],
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

// ✅ Get Product Detail

const getProductDetailService = async ({ id }) => {
  try {
    const product = await Product.findByPk(id, {
      include: [
        {
          model: Category,
          attributes: ["id", "name"],
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
