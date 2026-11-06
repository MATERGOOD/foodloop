import express from "express";
import {
  getDashboardStats,
  getUsers,
  verifyUser,
  updateReport,
  getAllReports
} from "../controllers/adminController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

// All admin routes require authentication and 'admin' role
router.use(authenticate, authorize("admin"));

router.get("/dashboard", getDashboardStats);
router.get("/users", getUsers);
router.patch("/users/:id/verify", verifyUser);
router.get("/reports", getAllReports);
router.patch("/reports/:id", updateReport);

export default router;
