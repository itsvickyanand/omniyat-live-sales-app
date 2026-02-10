const { DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // adjust path if different

const AdminSession = sequelize.define(
  "AdminSession",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },

    token: {
      type: DataTypes.STRING(512),
      allowNull: false,
      unique: true,
    },

    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "admin_sessions",

    timestamps: false, // we manually control timestamps

    indexes: [
      {
        unique: true,
        fields: ["token"],
      },
      {
        fields: ["expiresAt"],
      },
    ],
  }
);

module.exports = AdminSession;
