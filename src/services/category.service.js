const { Op } = require("sequelize");
const Category = require("../models/Category.model");
const slugify = require("../utils/slugify");

// ✅ Create unique slug helper
const generateUniqueSlug = async (name) => {
  const baseSlug = slugify(name);

  let slug = baseSlug;
  let count = 1;

  while (true) {
    const exists = await Category.findOne({ where: { slug } });
    if (!exists) return slug;

    slug = `${baseSlug}-${count}`;
    count++;
  }
};

// ✅ Create Category
const createCategoryService = async ({ name }) => {
  const existing = await Category.findOne({
    where: { name: name.trim() },
  });

  if (existing) {
    return {
      ok: false,
      statusCode: 409,
      message: "Category name already exists",
      error: "DUPLICATE_CATEGORY_NAME",
    };
  }

  const slug = await generateUniqueSlug(name);

  const category = await Category.create({
    name: name.trim(),
    slug,
  });

  return {
    ok: true,
    statusCode: 201,
    message: "Category created successfully",
    data: category,
  };
};

// ✅ Update Category
const updateCategoryService = async ({ id, name, isActive }) => {
  const category = await Category.findByPk(id);

  if (!category) {
    return {
      ok: false,
      statusCode: 404,
      message: "Category not found",
      error: "CATEGORY_NOT_FOUND",
    };
  }

  // Name update with uniqueness check
  if (name && name.trim() !== category.name) {
    const exists = await Category.findOne({
      where: {
        name: name.trim(),
        id: { [Op.ne]: id }, // not the same category
      },
    });

    if (exists) {
      return {
        ok: false,
        statusCode: 409,
        message: "Category name already taken",
        error: "DUPLICATE_CATEGORY_NAME",
      };
    }

    category.name = name.trim();
    category.slug = await generateUniqueSlug(name);
  }

  if (isActive !== undefined) {
    category.isActive = isActive;
  }

  await category.save();

  return {
    ok: true,
    statusCode: 200,
    message: "Category updated successfully",
    data: category,
  };
};

// ✅ Delete Category
const deleteCategoryService = async ({ id }) => {
  const category = await Category.findByPk(id);

  if (!category) {
    return {
      ok: false,
      statusCode: 404,
      message: "Category not found",
      error: "CATEGORY_NOT_FOUND",
    };
  }

  await category.destroy();

  return {
    ok: true,
    statusCode: 200,
    message: "Category deleted successfully",
    data: category,
  };
};

// ✅ Get All Categories
const getAllCategoriesService = async () => {
  const categories = await Category.findAll({
    order: [["createdAt", "DESC"]],
  });

  return {
    ok: true,
    statusCode: 200,
    message: "Categories fetched successfully",
    data: categories,
  };
};

// ✅ Get Category Detail
const getCategoryDetailService = async ({ id }) => {
  const category = await Category.findByPk(id);

  if (!category) {
    return {
      ok: false,
      statusCode: 404,
      message: "Category not found",
      error: "CATEGORY_NOT_FOUND",
    };
  }

  return {
    ok: true,
    statusCode: 200,
    message: "Category fetched successfully",
    data: category,
  };
};

module.exports = {
  createCategoryService,
  updateCategoryService,
  deleteCategoryService,
  getAllCategoriesService,
  getCategoryDetailService,
};
