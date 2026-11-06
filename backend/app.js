import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/authRoutes.js";
import foodRoutes from "./routes/foodRoutes.js";
import requestRoutes from "./routes/requestRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { initExpiryJob } from "./jobs/expiryJob.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Start node-cron expiry job
initExpiryJob();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Test route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "FoodLoop API is running successfully!",
    project: "FoodLoop"
  });
});

// API Routes (Mounted above 404 handler)
app.use("/api/auth", authRoutes);
app.use("/api/food", foodRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/admin", adminRoutes);

// 404 Not Found Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    data: null
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    data: null
  });
});

export default app;
