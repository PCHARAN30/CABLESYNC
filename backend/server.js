require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const requirePin = require("./middleware/auth");

const customerRoutes = require("./routes/customerRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const reportRoutes = require("./routes/reportRoutes");
const importRoutes = require("./routes/importRoutes");
const exportRoutes = require("./routes/exportRoutes");

const app = express();

// --- Middleware ---
const allowedOrigins = (process.env.FRONTEND_ORIGIN || "")
  .split(",")
  .map((s) => s.trim());
app.use(cors({ origin: allowedOrigins.length ? allowedOrigins : "*" }));
app.use(express.json());

// Health check - no PIN required, useful for Render's uptime pings
app.get("/health", (req, res) => res.json({ status: "ok" }));

// Everything below this line requires the operator PIN
app.use(requirePin);

app.use("/customers", customerRoutes);
app.use("/payments", paymentRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/reports", reportRoutes);
app.use("/import", importRoutes);
app.use("/export", exportRoutes);

// --- Error handling fallback ---
app.use((req, res) => res.status(404).json({ error: "Route not found" }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong" });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () =>
    console.log(`CableSync backend running on port ${PORT}`),
  );
});
