// require("dotenv").config();
// const cors = require("cors");
// const express = require("express");
// const cookieParser = require("cookie-parser");

// const db = require("./models");

// const categoryRoutes = require("./routes/category.routes");
// const productRoutes = require("./routes/product.routes");
// const uploadRoutes = require("./routes/upload.routes");
// const orderRoutes = require("./routes/order.routes");
// const paymentRoutes = require("./routes/payment.routes");
// const mockPaymentRoutes = require("./routes/mockPayment.routes");
// const adminAuthRoutes = require("./routes/adminAuth.routes");
// const artistRoutes = require("./routes/artist.routes");

// const app = express();
// app.use(cookieParser());

// /*
// IMPORTANT: CCAvenue sends RAW body.
// This must be registered BEFORE express.json()
// */
// app.use("/api/payment/ccavenue/response", express.raw({ type: "*/*" }));

// /*
// Normal parsers for rest of routes
// */
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
// //   ? process.env.CORS_ALLOWED_ORIGINS.split(",")
// //   : [];

// // app.use(
// //   cors({
// //     origin: function (origin, callback) {
// //       // ✅ CRITICAL FIX: allow server-to-server calls (CCAvenue)
// //       if (!origin) {
// //         return callback(null, true);
// //       }

// //       if (allowedOrigins.includes(origin)) {
// //         return callback(null, true);
// //       }

// //       console.warn("Blocked by CORS:", origin);

// //       // ❌ DO NOT throw error
// //       return callback(null, true);
// //     },
// //     credentials: true,
// //   })
// // );
// const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
//   ? process.env.CORS_ALLOWED_ORIGINS.split(",").map((o) => o.trim())
//   : [];

// app.use(
//   cors({
//     origin: function (origin, callback) {
//       if (!origin) return callback(null, true);

//       if (allowedOrigins.includes(origin)) {
//         return callback(null, origin);
//       }

//       return callback(new Error("Not allowed by CORS"));
//     },
//     credentials: true,
//   })
// );

// /*
// Routes
// */
// app.use("/admin", adminAuthRoutes);
// app.use("/api/category", categoryRoutes);
// app.use("/api/product", productRoutes);
// app.use("/api/upload", uploadRoutes);
// app.use("/api/order", orderRoutes);
// app.use("/api/payment", paymentRoutes);
// app.use("/api/mock-payment", mockPaymentRoutes);
// app.use("/api/artist", artistRoutes);
// app.use("/api/debug", require("./routes/debug.routes"));

// /*
// Health check
// */
// app.get("/", (req, res) => {
//   res.send("Ecom Backend Running ✅");
// });

// /*
// DB + Server start
// */
// db.sequelize
//   .authenticate()
//   .then(async () => {
//     console.log("✅ PostgreSQL connected successfully");

//     await db.sequelize.sync({ alter: true });

//     console.log("✅ Models synced");

//     app.listen(process.env.PORT || 3000, () => {
//       console.log(`🚀 Server running on port ${process.env.PORT || 3000}`);
//     });
//   })
//   .catch((err) => {
//     console.log("❌ DB Connection error:", err.message);
//   });

require("dotenv").config();
const cors = require("cors");
const express = require("express");
const cookieParser = require("cookie-parser");

const db = require("./models");

const categoryRoutes = require("./routes/category.routes");
const productRoutes = require("./routes/product.routes");
const uploadRoutes = require("./routes/upload.routes");
const orderRoutes = require("./routes/order.routes");
const paymentRoutes = require("./routes/payment.routes");
const mockPaymentRoutes = require("./routes/mockPayment.routes");
const adminAuthRoutes = require("./routes/adminAuth.routes");
const artistRoutes = require("./routes/artist.routes");

const app = express();

app.use(cookieParser());

/*
IMPORTANT: RAW body FIRST (CCAvenue)
*/
app.use("/api/payment/ccavenue/response", express.raw({ type: "*/*" }));

/*
CORS MUST BE BEFORE JSON PARSER
*/
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
  ? process.env.CORS_ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : [];

/*
Add CCAvenue domains
*/
const allowedGatewayOrigins = [
  "https://secure.ccavenue.ae",
  "https://test.ccavenue.ae",
  "https://secure.ccavenue.com",
  "https://test.ccavenue.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow server-to-server (Postman, cron, etc)
      if (!origin) {
        return callback(null, true);
      }

      // Allow frontend
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Allow CCAvenue
      if (allowedGatewayOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn("Blocked by CORS:", origin);

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

/*
NOW JSON parser
*/
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/*
Routes
*/
app.use("/admin", adminAuthRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/product", productRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/mock-payment", mockPaymentRoutes);
app.use("/api/artist", artistRoutes);
app.use("/api/debug", require("./routes/debug.routes"));

/*
Health check
*/
app.get("/", (req, res) => {
  res.send("Ecom Backend Running ✅");
});

/*
Start server
*/
db.sequelize
  .authenticate()
  .then(async () => {
    console.log("✅ PostgreSQL connected successfully");

    await db.sequelize.sync({ alter: true });

    console.log("✅ Models synced");

    app.listen(process.env.PORT || 3000, () => {
      console.log(`🚀 Server running on port ${process.env.PORT || 3000}`);
    });
  })
  .catch((err) => {
    console.log("❌ DB Connection error:", err.message);
  });
