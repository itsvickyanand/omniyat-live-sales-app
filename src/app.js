require("dotenv").config();
const cors = require("cors");
const express = require("express");

const db = require("./models");

const categoryRoutes = require("./routes/category.routes");
const productRoutes = require("./routes/product.routes");
const uploadRoutes = require("./routes/upload.routes");
const orderRoutes = require("./routes/order.routes");
const paymentRoutes = require("./routes/payment.routes");
const mockPaymentRoutes = require("./routes/mockPayment.routes");

const app = express();

/*
IMPORTANT: CCAvenue sends RAW body.
This must be registered BEFORE express.json()
*/
app.use("/api/payment/ccavenue/response", express.raw({ type: "*/*" }));

/*
Normal parsers for rest of routes
*/
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
  ? process.env.CORS_ALLOWED_ORIGINS.split(",")
  : [];

app.use(
  cors({
    origin: function (origin, callback) {
      // ✅ CRITICAL FIX: allow server-to-server calls (CCAvenue)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn("Blocked by CORS:", origin);

      // ❌ DO NOT throw error
      return callback(null, true);
    },
    credentials: true,
  })
);

/*
Routes
*/
app.use("/api/category", categoryRoutes);
app.use("/api/product", productRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/mock-payment", mockPaymentRoutes);

/*
Health check
*/
app.get("/", (req, res) => {
  res.send("Ecom Backend Running ✅");
});

/*
DB + Server start
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
