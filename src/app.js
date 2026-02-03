require("dotenv").config();
const cors = require("cors");

const express = require("express");
const db = require("./models");
const categoryRoutes = require("./routes/category.routes");
const productRoutes = require("./routes/product.routes");
const uploadRoutes = require("./routes/upload.routes");
const orderRoutes = require("./routes/order.routes");

const app = express();
app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:3001",
    credentials: true,
  })
);

app.use("/api/category", categoryRoutes);
app.use("/api/product", productRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/order", orderRoutes);

app.get("/", (req, res) => {
  res.send("Ecom Backend Running ✅");
});

db.sequelize
  .authenticate()
  .then(async () => {
    console.log("✅ PostgreSQL connected successfully");

    // ✅ Auto create tables (only for dev)
    await db.sequelize.sync({ alter: true });
    console.log("✅ Models synced");

    app.listen(process.env.PORT || 3000, () => {
      console.log(`🚀 Server running on port ${process.env.PORT || 3000}`);
    });
  })
  .catch((err) => {
    console.log("❌ DB Connection error:", err.message);
  });
