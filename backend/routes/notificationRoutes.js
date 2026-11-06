import express from "express";
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead
} from "../controllers/notificationController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);

router.get("/", getMyNotifications);
router.patch("/read-all", markAllNotificationsRead);
router.patch("/:id/read", markNotificationRead);

export default router;
