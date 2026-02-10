const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: process.env.DB_DIALECT,
    logging: false, // set true if you want SQL logs
  }
);

module.exports = sequelize;

// const { Sequelize } = require("sequelize");

// const sequelize = new Sequelize(
//   process.env.DB_NAME,
//   process.env.DB_USER,
//   process.env.DB_PASSWORD,
//   {
//     host: process.env.DB_HOST,
//     port: 5432,
//     dialect: "postgres",

//     logging: false,

//     dialectOptions: {
//       ssl: {
//         require: true,
//         rejectUnauthorized: false,
//       },
//     },

//     pool: {
//       max: 5,
//       min: 0,
//       acquire: 30000,
//       idle: 10000,
//     },
//   }
// );

// sequelize
//   .authenticate()
//   .then(() => {
//     console.log("✅ Azure PostgreSQL connected via Sequelize");
//   })
//   .catch((err) => {
//     console.error("❌ Sequelize connection error:", err.message);
//   });

// module.exports = sequelize;
