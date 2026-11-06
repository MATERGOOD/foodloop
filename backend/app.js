
import express from "express";
import cors from "cors";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "FoodLoop API is running successfully!",
    project: "FoodLoop"
  });
});

export default app;
