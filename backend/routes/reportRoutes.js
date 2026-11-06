import express from "express";
import { createReport, getMyReports } from "../controllers/reportController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);

router.post("/", createReport);
router.get("/my", getMyReports);

export default router;
