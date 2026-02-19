// const { Product, Category, Artist, sequelize } = require("../models");
// const slugify = require("../utils/slugify");

// /*
// ========================================
// UTILITY: GENERATE UNIQUE SLUG
// ========================================
// */
// const generateUniqueSlug = async (name, transaction = null) => {
//   const baseSlug = slugify(name);

//   let slug = baseSlug;
//   let counter = 1;

//   while (true) {
//     const exists = await Product.findOne({
//       where: { slug },
//       transaction,
//     });

//     if (!exists) break;

//     slug = `${baseSlug}-${counter}`;
//     counter++;
//   }

//   return slug;
// };

// /*
// ========================================
// CREATE PRODUCT SERVICE
// ========================================
// */
// const createProductService = async (payload) => {
//   const transaction = await sequelize.transaction();

//   try {
//     const {
//       categoryId,
//       artistId,
//       name,

//       price,
//       stock = 0,

//       description = null,
//       size = null,
//       weight = null,
//       donationPercentage = null,
//       deliveryInfo = null,
//       address = null,
//       installationInstructions = null,

//       images = [],
//       thumbnail = null,

//       isActive = true,
//     } = payload;

//     /*
//     VALIDATE CATEGORY
//     */
//     const category = await Category.findByPk(categoryId, { transaction });

//     if (!category) {
//       await transaction.rollback();

//       return {
//         ok: false,
//         statusCode: 404,
//         message: "Category not found",
//         error: "CATEGORY_NOT_FOUND",
//       };
//     }

//     /*
//     VALIDATE ARTIST
//     */
//     const artist = await Artist.findByPk(artistId, { transaction });

//     if (!artist) {
//       await transaction.rollback();

//       return {
//         ok: false,
//         statusCode: 404,
//         message: "Artist not found",
//         error: "ARTIST_NOT_FOUND",
//       };
//     }

//     /*
//     GENERATE UNIQUE SLUG
//     */
//     const slug = await generateUniqueSlug(name, transaction);

//     /*
//     CREATE PRODUCT
//     */
//     const product = await Product.create(
//       {
//         categoryId,
//         artistId,
//         name,
//         slug,

//         price: Number(price),
//         stock: Number(stock),

//         description,
//         size,
//         weight,
//         donationPercentage,
//         deliveryInfo,
//         address,
//         installationInstructions,

//         images,
//         thumbnail: thumbnail || images?.[0] || null,

//         isActive,
//       },
//       { transaction }
//     );

//     await transaction.commit();

//     return {
//       ok: true,
//       statusCode: 201,
//       message: "Product created successfully",
//       data: product,
//     };
//   } catch (error) {
//     await transaction.rollback();

//     return {
//       ok: false,
//       statusCode: 500,
//       message: "Failed to create product",
//       error: error.message,
//     };
//   }
// };

// /*
// ========================================
// UPDATE PRODUCT SERVICE
// ========================================
// */
// const updateProductService = async ({ id, ...payload }) => {
//   const transaction = await sequelize.transaction();

//   try {
//     const product = await Product.findByPk(id, { transaction });

//     if (!product) {
//       await transaction.rollback();

//       return {
//         ok: false,
//         statusCode: 404,
//         message: "Product not found",
//         error: "NOT_FOUND",
//       };
//     }

//     /*
//     VALIDATE CATEGORY IF CHANGED
//     */
//     if (payload.categoryId && payload.categoryId !== product.categoryId) {
//       const category = await Category.findByPk(payload.categoryId, {
//         transaction,
//       });

//       if (!category) {
//         await transaction.rollback();

//         return {
//           ok: false,
//           statusCode: 404,
//           message: "Category not found",
//           error: "CATEGORY_NOT_FOUND",
//         };
//       }
//     }

//     /*
//     VALIDATE ARTIST IF CHANGED
//     */
//     if (payload.artistId && payload.artistId !== product.artistId) {
//       const artist = await Artist.findByPk(payload.artistId, {
//         transaction,
//       });

//       if (!artist) {
//         await transaction.rollback();

//         return {
//           ok: false,
//           statusCode: 404,
//           message: "Artist not found",
//           error: "ARTIST_NOT_FOUND",
//         };
//       }
//     }

//     /*
//     AUTO UPDATE SLUG IF NAME CHANGED
//     */
//     let slug = product.slug;

//     if (payload.name && payload.name !== product.name) {
//       slug = await generateUniqueSlug(payload.name, transaction);
//     }

//     /*
//     UPDATE PRODUCT
//     */
//     await product.update(
//       {
//         categoryId: payload.categoryId ?? product.categoryId,
//         artistId: payload.artistId ?? product.artistId,

//         name: payload.name ?? product.name,
//         slug,

//         price:
//           payload.price !== undefined ? Number(payload.price) : product.price,

//         stock:
//           payload.stock !== undefined ? Number(payload.stock) : product.stock,

//         description: payload.description ?? product.description,
//         size: payload.size ?? product.size,
//         weight: payload.weight ?? product.weight,
//         donationPercentage:
//           payload.donationPercentage ?? product.donationPercentage,
//         deliveryInfo: payload.deliveryInfo ?? product.deliveryInfo,
//         address: payload.address ?? product.address,
//         installationInstructions:
//           payload.installationInstructions ?? product.installationInstructions,

//         images: payload.images ?? product.images,
//         thumbnail: payload.thumbnail ?? product.thumbnail,

//         isActive: payload.isActive ?? product.isActive,
//       },
//       { transaction }
//     );

//     await transaction.commit();

//     return {
//       ok: true,
//       statusCode: 200,
//       message: "Product updated successfully",
//       data: product,
//     };
//   } catch (error) {
//     await transaction.rollback();

//     return {
//       ok: false,
//       statusCode: 500,
//       message: "Failed to update product",
//       error: error.message,
//     };
//   }
// };

// /*
// ========================================
// DELETE PRODUCT SERVICE
// ========================================
// */
// const deleteProductService = async ({ id }) => {
//   const transaction = await sequelize.transaction();

//   try {
//     const product = await Product.findByPk(id, { transaction });

//     if (!product) {
//       await transaction.rollback();

//       return {
//         ok: false,
//         statusCode: 404,
//         message: "Product not found",
//         error: "NOT_FOUND",
//       };
//     }

//     await product.destroy({ transaction });

//     await transaction.commit();

//     return {
//       ok: true,
//       statusCode: 200,
//       message: "Product deleted successfully",
//     };
//   } catch (error) {
//     await transaction.rollback();

//     return {
//       ok: false,
//       statusCode: 500,
//       message: "Failed to delete product",
//       error: error.message,
//     };
//   }
// };

// /*
// ========================================
// GET ALL PRODUCTS SERVICE
// ========================================
// */
// const getAllProductsService = async () => {
//   try {
//     const products = await Product.findAll({
//       include: [
//         {
//           model: Category,
//           as: "category",
//           attributes: ["id", "name", "slug"],
//         },
//         {
//           model: Artist,
//           as: "artist",
//           attributes: ["id", "name", "imageUrl"],
//         },
//       ],

//       order: [["createdAt", "DESC"]],
//     });

//     return {
//       ok: true,
//       statusCode: 200,
//       message: "Products fetched successfully",
//       data: products,
//     };
//   } catch (error) {
//     return {
//       ok: false,
//       statusCode: 500,
//       message: "Failed to fetch products",
//       error: error.message,
//     };
//   }
// };

// /*
// ========================================
// GET PRODUCT DETAIL SERVICE
// ========================================
// */
// const getProductDetailService = async ({ id }) => {
//   try {
//     const product = await Product.findByPk(id, {
//       include: [
//         {
//           model: Category,
//           as: "category",
//           attributes: ["id", "name", "slug"],
//         },
//         {
//           model: Artist,
//           as: "artist",
//           attributes: ["id", "name", "imageUrl"],
//         },
//       ],
//     });

//     if (!product) {
//       return {
//         ok: false,
//         statusCode: 404,
//         message: "Product not found",
//         error: "NOT_FOUND",
//       };
//     }

//     return {
//       ok: true,
//       statusCode: 200,
//       message: "Product fetched successfully",
//       data: product,
//     };
//   } catch (error) {
//     return {
//       ok: false,
//       statusCode: 500,
//       message: "Failed to fetch product",
//       error: error.message,
//     };
//   }
// };

// module.exports = {
//   createProductService,
//   updateProductService,
//   deleteProductService,
//   getAllProductsService,
//   getProductDetailService,
// };

const { Product, Category, Artist, sequelize } = require("../models");
const slugify = require("../utils/slugify");

/*
========================================
UTILITY: GENERATE UNIQUE SLUG
========================================
*/
const generateUniqueSlug = async (name, transaction = null) => {
  const baseSlug = slugify(name);

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const exists = await Product.findOne({
      where: { slug },
      transaction,
    });

    if (!exists) break;

    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};

/*
========================================
CREATE PRODUCT SERVICE
========================================
*/
const createProductService = async (payload) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      categoryId,
      artistId,
      name,
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

    /*
    VALIDATE CATEGORY
    */
    const category = await Category.findByPk(categoryId, {
      transaction,
    });

    if (!category) {
      await transaction.rollback();

      return {
        ok: false,
        statusCode: 404,
        message: "Category not found",
        error: "CATEGORY_NOT_FOUND",
      };
    }

    /*
    VALIDATE ARTIST
    */
    const artist = await Artist.findByPk(artistId, {
      transaction,
    });

    if (!artist) {
      await transaction.rollback();

      return {
        ok: false,
        statusCode: 404,
        message: "Artist not found",
        error: "ARTIST_NOT_FOUND",
      };
    }

    /*
    GENERATE UNIQUE SLUG
    */
    const slug = await generateUniqueSlug(name, transaction);

    /*
    CREATE PRODUCT
    */
    const product = await Product.create(
      {
        categoryId,
        artistId,
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
        thumbnail: thumbnail || images?.[0] || null,

        isActive,
      },
      { transaction }
    );

    await transaction.commit();

    /*
    RETURN WITH ASSOCIATIONS
    */
    const createdProduct = await Product.findByPk(product.id, {
      include: [
        {
          model: Category,
          as: "category",
          attributes: ["id", "name", "slug"],
        },
        {
          model: Artist,
          as: "artist",
          attributes: ["id", "name", "imageUrl"],
        },
      ],
    });

    return {
      ok: true,
      statusCode: 201,
      message: "Product created successfully",
      data: createdProduct,
    };
  } catch (error) {
    await transaction.rollback();

    return {
      ok: false,
      statusCode: 500,
      message: "Failed to create product",
      error: error.message,
    };
  }
};

/*
========================================
UPDATE PRODUCT SERVICE
========================================
*/
const updateProductService = async ({ id, ...payload }) => {
  const transaction = await sequelize.transaction();

  try {
    const product = await Product.findByPk(id, {
      transaction,
    });

    if (!product) {
      await transaction.rollback();

      return {
        ok: false,
        statusCode: 404,
        message: "Product not found",
        error: "NOT_FOUND",
      };
    }

    /*
    VALIDATE CATEGORY IF CHANGED
    */
    if (payload.categoryId && payload.categoryId !== product.categoryId) {
      const category = await Category.findByPk(payload.categoryId, {
        transaction,
      });

      if (!category) {
        await transaction.rollback();

        return {
          ok: false,
          statusCode: 404,
          message: "Category not found",
          error: "CATEGORY_NOT_FOUND",
        };
      }
    }

    /*
    VALIDATE ARTIST IF CHANGED
    */
    if (payload.artistId && payload.artistId !== product.artistId) {
      const artist = await Artist.findByPk(payload.artistId, { transaction });

      if (!artist) {
        await transaction.rollback();

        return {
          ok: false,
          statusCode: 404,
          message: "Artist not found",
          error: "ARTIST_NOT_FOUND",
        };
      }
    }

    /*
    AUTO UPDATE SLUG IF NAME CHANGED
    */
    let slug = product.slug;

    if (payload.name && payload.name !== product.name) {
      slug = await generateUniqueSlug(payload.name, transaction);
    }

    /*
    UPDATE PRODUCT
    */
    await product.update(
      {
        categoryId: payload.categoryId ?? product.categoryId,

        artistId: payload.artistId ?? product.artistId,

        name: payload.name ?? product.name,

        slug,

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
      },
      { transaction }
    );

    await transaction.commit();

    /*
    RETURN UPDATED WITH ASSOCIATIONS
    */
    const updatedProduct = await Product.findByPk(id, {
      include: [
        {
          model: Category,
          as: "category",
          attributes: ["id", "name", "slug"],
        },
        {
          model: Artist,
          as: "artist",
          attributes: ["id", "name", "imageUrl"],
        },
      ],
    });

    return {
      ok: true,
      statusCode: 200,
      message: "Product updated successfully",
      data: updatedProduct,
    };
  } catch (error) {
    await transaction.rollback();

    return {
      ok: false,
      statusCode: 500,
      message: "Failed to update product",
      error: error.message,
    };
  }
};

/*
========================================
DELETE PRODUCT SERVICE
========================================
*/
const deleteProductService = async ({ id }) => {
  const transaction = await sequelize.transaction();

  try {
    const product = await Product.findByPk(id, {
      transaction,
    });

    if (!product) {
      await transaction.rollback();

      return {
        ok: false,
        statusCode: 404,
        message: "Product not found",
        error: "NOT_FOUND",
      };
    }

    await product.destroy({ transaction });

    await transaction.commit();

    return {
      ok: true,
      statusCode: 200,
      message: "Product deleted successfully",
    };
  } catch (error) {
    await transaction.rollback();

    return {
      ok: false,
      statusCode: 500,
      message: "Failed to delete product",
      error: error.message,
    };
  }
};

/*
========================================
GET ALL PRODUCTS SERVICE
========================================
*/
const getAllProductsService = async () => {
  try {
    const products = await Product.findAll({
      include: [
        {
          model: Category,
          as: "category", // ✅ REQUIRED
          attributes: ["id", "name", "slug"],
        },
        {
          model: Artist,
          as: "artist", // ✅ REQUIRED
          attributes: ["id", "name", "imageUrl"],
        },
      ],

      order: [["createdAt", "DESC"]],
    });

    return {
      ok: true,
      statusCode: 200,
      message: "Products fetched successfully",
      data: products,
    };
  } catch (error) {
    return {
      ok: false,
      statusCode: 500,
      message: "Failed to fetch products",
      error: error.message,
    };
  }
};

/*
========================================
GET PRODUCT DETAIL SERVICE
========================================
*/
const getProductDetailService = async ({ id }) => {
  try {
    const product = await Product.findByPk(id, {
      include: [
        {
          model: Category,
          as: "category",
          attributes: ["id", "name", "slug"],
        },
        {
          model: Artist,
          as: "artist",
          // attributes: ["id", "name", "imageUrl"],
        },
      ],
    });

    if (!product) {
      return {
        ok: false,
        statusCode: 404,
        message: "Product not found",
        error: "NOT_FOUND",
      };
    }

    return {
      ok: true,
      statusCode: 200,
      message: "Product fetched successfully",
      data: product,
    };
  } catch (error) {
    return {
      ok: false,
      statusCode: 500,
      message: "Failed to fetch product",
      error: error.message,
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
