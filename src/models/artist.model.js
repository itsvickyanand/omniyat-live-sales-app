const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Artist = sequelize.define(
  "Artist",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },

    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
      validate: {
        notNull: { msg: "Artist name is required" },
        notEmpty: { msg: "Artist name cannot be empty" },
        len: {
          args: [2, 320],
          msg: "Artist name must be between 2 and 120 characters",
        },
      },
    },

    imageUrl: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: { msg: "Artist image is required" },
        notEmpty: { msg: "Artist image cannot be empty" },
        isUrl: { msg: "Artist image must be a valid URL" },
      },
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "artists",
    timestamps: true,
    indexes: [
      { fields: ["name"] },
      { fields: ["isActive"] },
      { fields: ["createdAt"] },
    ],
  }
);

module.exports = Artist;
