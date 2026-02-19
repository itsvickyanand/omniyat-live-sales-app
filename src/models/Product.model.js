const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Product = sequelize.define(
  "Product",
  {
    /*
    ========================================
    PRIMARY KEY
    ========================================
    */
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },

    /*
    ========================================
    CATEGORY FOREIGN KEY
    ========================================
    */
    categoryId: {
      type: DataTypes.UUID,
      allowNull: false,

      references: {
        model: "categories",
        key: "id",
      },

      onDelete: "RESTRICT",
      onUpdate: "CASCADE",

      validate: {
        notNull: {
          msg: "Category is required",
        },
        isUUID: {
          args: 4,
          msg: "Invalid category ID",
        },
      },
    },

    /*
    ========================================
    ARTIST FOREIGN KEY
    ========================================
    */
    artistId: {
      type: DataTypes.UUID,
      allowNull: false,

      references: {
        model: "artists",
        key: "id",
      },

      onDelete: "RESTRICT",
      onUpdate: "CASCADE",

      validate: {
        notNull: {
          msg: "Artist is required",
        },
        isUUID: {
          args: 4,
          msg: "Invalid artist ID",
        },
      },
    },

    /*
    ========================================
    NAME
    ========================================
    */
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,

      validate: {
        notNull: {
          msg: "Product name is required",
        },
        notEmpty: {
          msg: "Product name cannot be empty",
        },
        len: {
          args: [2, 150],
          msg: "Product name must be between 2 and 150 characters",
        },
      },
    },

    /*
    ========================================
    SLUG
    ========================================
    */
    slug: {
      type: DataTypes.STRING(200),
      allowNull: false,
      unique: {
        msg: "Slug already exists",
      },

      validate: {
        notNull: {
          msg: "Slug is required",
        },
        notEmpty: {
          msg: "Slug cannot be empty",
        },
        len: {
          args: [2, 200],
          msg: "Slug must be between 2 and 200 characters",
        },
        is: {
          args: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
          msg: "Slug must be lowercase and hyphen-separated",
        },
      },
    },

    /*
    ========================================
    DESCRIPTION
    ========================================
    */
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    /*
    ========================================
    PRICE
    ========================================
    */
    price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,

      validate: {
        notNull: {
          msg: "Price is required",
        },
        isDecimal: {
          msg: "Price must be a valid decimal",
        },
        min: {
          args: [0],
          msg: "Price cannot be negative",
        },
      },
    },

    /*
    ========================================
    STOCK
    ========================================
    */
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,

      validate: {
        notNull: {
          msg: "Stock is required",
        },
        isInt: {
          msg: "Stock must be an integer",
        },
        min: {
          args: [0],
          msg: "Stock cannot be negative",
        },
      },
    },

    /*
    ========================================
    OPTIONAL FIELDS
    ========================================
    */

    size: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    weight: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    donationPercentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,

      validate: {
        isDecimal: true,
        min: 0,
        max: 100,
      },
    },

    deliveryInfo: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    address: {
      type: DataTypes.STRING(300),
      allowNull: true,
    },

    installationInstructions: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    /*
    ========================================
    IMAGES
    ========================================
    */
    images: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],

      validate: {
        isArray(value) {
          if (!Array.isArray(value)) {
            throw new Error("Images must be an array");
          }
        },
        isValidUrls(value) {
          for (const url of value) {
            if (typeof url !== "string" || url.trim() === "") {
              throw new Error("Invalid image URL");
            }
          }
        },
      },
    },

    /*
    ========================================
    THUMBNAIL
    ========================================
    */
    thumbnail: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    /*
    ========================================
    ACTIVE FLAG
    ========================================
    */
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },

  {
    tableName: "products",

    timestamps: true,

    paranoid: true, // enables soft delete

    indexes: [
      {
        unique: true,
        fields: ["slug"],
      },

      {
        fields: ["categoryId"],
      },

      {
        fields: ["artistId"],
      },

      {
        fields: ["isActive"],
      },

      {
        fields: ["price"],
      },

      {
        fields: ["createdAt"],
      },
    ],

    /*
    ========================================
    HOOKS
    ========================================
    */
    hooks: {
      beforeValidate(product) {
        if (product.slug) {
          product.slug = product.slug.trim().toLowerCase();
        }

        if (product.name) {
          product.name = product.name.trim();
        }
      },
    },
  }
);

module.exports = Product;

// const { DataTypes } = require("sequelize");
// const sequelize = require("../config/db");

// const Product = sequelize.define(
//   "Product",
//   {
//     // Primary key
//     id: {
//       type: DataTypes.UUID,
//       defaultValue: DataTypes.UUIDV4,
//       primaryKey: true,
//       allowNull: false,
//     },

//     // Category reference
//     categoryId: {
//       type: DataTypes.UUID,
//       allowNull: false,
//       validate: {
//         notNull: { msg: "categoryId is required" },
//         notEmpty: { msg: "categoryId cannot be empty" },
//       },
//     },

//     // NEW: Artist name
//     artistName: {
//       type: DataTypes.STRING(200),
//       allowNull: false,
//       validate: {
//         notNull: { msg: "Artist name is required" },
//         notEmpty: { msg: "Artist name cannot be empty" },
//         len: {
//           args: [2, 200],
//           msg: "Artist name must be between 2 and 200 characters",
//         },
//       },
//     },

//     // Product / Artwork name
//     name: {
//       type: DataTypes.STRING(150),
//       allowNull: false,
//       validate: {
//         notNull: { msg: "Product name is required" },
//         notEmpty: { msg: "Product name cannot be empty" },
//         len: {
//           args: [2, 150],
//           msg: "Product name must be between 2 and 150 characters",
//         },
//       },
//     },

//     // SEO slug
//     slug: {
//       type: DataTypes.STRING(200),
//       allowNull: false,
//       unique: true,
//       validate: {
//         notNull: { msg: "Product slug is required" },
//         notEmpty: { msg: "Product slug cannot be empty" },
//         len: {
//           args: [2, 200],
//           msg: "Product slug must be between 2 and 200 characters",
//         },
//         is: {
//           args: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
//           msg: "Slug must be lowercase and hyphen-separated (example: nike-air-max)",
//         },
//       },
//     },

//     // Description
//     description: {
//       type: DataTypes.TEXT,
//       allowNull: true,
//       validate: {
//         notEmpty: {
//           msg: "Description cannot be empty (or send null)",
//         },
//       },
//     },

//     // Price
//     price: {
//       type: DataTypes.DECIMAL(10, 2),
//       allowNull: false,
//       defaultValue: 0,
//       validate: {
//         notNull: { msg: "Price is required" },
//         isDecimal: { msg: "Price must be a decimal number" },
//         min: {
//           args: [0],
//           msg: "Price cannot be negative",
//         },
//       },
//     },

//     // Stock
//     stock: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//       defaultValue: 0,
//       validate: {
//         notNull: { msg: "Stock is required" },
//         isInt: { msg: "Stock must be an integer" },
//         min: {
//           args: [0],
//           msg: "Stock cannot be negative",
//         },
//       },
//     },

//     // NEW: Artwork size
//     size: {
//       type: DataTypes.STRING(100),
//       allowNull: true,
//       comment: "Example: 150cm x 120cm",
//     },

//     // NEW: Artwork weight
//     weight: {
//       type: DataTypes.STRING(50),
//       allowNull: true,
//       comment: "Example: 5kg",
//     },

//     // NEW: Donation percentage
//     donationPercentage: {
//       type: DataTypes.DECIMAL(5, 2),
//       allowNull: true,
//       validate: {
//         isDecimal: { msg: "Donation percentage must be a number" },
//         min: {
//           args: [0],
//           msg: "Donation percentage cannot be negative",
//         },
//         max: {
//           args: [100],
//           msg: "Donation percentage cannot exceed 100",
//         },
//       },
//       comment: "Value between 0 and 100",
//     },

//     // NEW: Delivery info
//     deliveryInfo: {
//       type: DataTypes.TEXT,
//       allowNull: true,
//       comment: "Delivery details and conditions",
//     },

//     // NEW: Address / location
//     address: {
//       type: DataTypes.STRING(300),
//       allowNull: true,
//       comment: "Artwork location or delivery address",
//     },

//     // NEW: Installation instructions
//     installationInstructions: {
//       type: DataTypes.TEXT,
//       allowNull: true,
//       comment: "Installation or display instructions",
//     },

//     // Product Images
//     images: {
//       type: DataTypes.ARRAY(DataTypes.STRING),
//       allowNull: false,
//       defaultValue: [],
//       validate: {
//         isArrayOfStrings(value) {
//           if (!Array.isArray(value)) {
//             throw new Error("Images must be an array");
//           }
//           for (const img of value) {
//             if (typeof img !== "string" || img.trim().length === 0) {
//               throw new Error("Each image must be a non-empty string");
//             }
//           }
//         },
//       },
//     },

//     // Thumbnail
//     thumbnail: {
//       type: DataTypes.STRING,
//       allowNull: true,
//       validate: {
//         notEmpty: {
//           msg: "Thumbnail cannot be empty (or send null)",
//         },
//       },
//     },

//     // Active flag
//     isActive: {
//       type: DataTypes.BOOLEAN,
//       allowNull: false,
//       defaultValue: true,
//       validate: {
//         notNull: { msg: "isActive must be true or false" },
//         isIn: {
//           args: [[true, false]],
//           msg: "isActive must be boolean",
//         },
//       },
//     },
//   },
//   {
//     tableName: "products",
//     timestamps: true,

//     indexes: [
//       { unique: true, fields: ["slug"] },
//       { fields: ["name"] },
//       { fields: ["artistName"] },
//       { fields: ["categoryId"] },
//       { fields: ["price"] },
//       { fields: ["isActive"] },
//     ],
//   }
// );

// module.exports = Product;
