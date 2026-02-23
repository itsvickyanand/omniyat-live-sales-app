if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = "development";
}

// Load correct env file based on NODE_ENV
require("dotenv").config({
  path: `.env.${process.env.NODE_ENV}`,
});

console.log("DB NAME:", process.env.DB_NAME);
console.log("DB HOST:", process.env.DB_HOST);

console.log("🌍 Environment:", process.env.NODE_ENV);

/*
=====================================================
IMPORTS
=====================================================
*/
const runPaymentReconciliation = require("./cron/paymentReconciliation.cron");

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
const ccavenueLookupRoutes = require("./routes/ccavenueLookup.routes");

const app = express();
app.use(cookieParser());

/*
=====================================================
RAW BODY FIRST (CCAvenue)
=====================================================
*/

app.use("/api/payment/ccavenue/response", express.raw({ type: "*/*" }));

/*
=====================================================
CORS
=====================================================
*/

const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
  ? process.env.CORS_ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : [];

const allowedGatewayOrigins = [
  "https://secure.ccavenue.ae",
  "https://test.ccavenue.ae",
  "https://secure.ccavenue.com",
  "https://test.ccavenue.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

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
=====================================================
BODY PARSERS
=====================================================
*/

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/*
=====================================================
ROUTES
=====================================================
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
app.use("/api/admin", ccavenueLookupRoutes);

/*
=====================================================
HEALTH CHECK
=====================================================
*/

app.get("/", (req, res) => {
  res.send("Ecom Backend Running ✅");
});

/*
=====================================================
START SERVER
=====================================================
*/

db.sequelize
  .authenticate()
  .then(async () => {
    console.log("✅ PostgreSQL connected successfully");

    // Auto sync only in development + staging
    // if (
    //   process.env.NODE_ENV === "development" ||
    //   process.env.NODE_ENV === "staging"
    // ) {
    await db.sequelize.sync({ alter: true });
    console.log("⚙️ Schema synced (non-production)");
    // } else {
    //   console.log("🔒 Production mode - skipping auto sync");
    // }
    runPaymentReconciliation();

    app.listen(process.env.PORT || 3000, () => {
      console.log(`🚀 Server running on port ${process.env.PORT || 3000}`);
    });
  })
  .catch((err) => {
    console.error("❌ DB Connection error:", err.message);
  });
