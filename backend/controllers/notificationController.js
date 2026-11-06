import mongoose from "mongoose";
import Notification from "../models/Notification.js";

/**
 * @desc    Get user notifications
 * @route   GET /api/notifications
 * @access  Private (Logged-in user)
 */
export const getMyNotifications = async (req, res) => {
  try {
    const filter = { userId: req.user._id };

    if (req.query.unread === "true") {
      filter.isRead = false;
    }

    const notifications = await Notification.find(filter)
      .populate("relatedListingId", "foodName status")
      .populate("relatedRequestId", "status requestedQuantity")
      .sort({ createdAt: -1 });

    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      isRead: false
    });

    return res.status(200).json({
      success: true,
      message: "Notifications retrieved successfully.",
      data: {
        notifications,
        unreadCount
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve notifications.",
      data: null
    });
  }
};

/**
 * @desc    Mark a notification as read
 * @route   PATCH /api/notifications/:id/read
 * @access  Private (Logged-in user)
 */
export const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID.",
        data: null
      });
    }

    const notification = await Notification.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
        data: null
      });
    }

    notification.isRead = true;
    await notification.save();

    return res.status(200).json({
      success: true,
      message: "Notification marked as read.",
      data: {
        notification
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update notification.",
      data: null
    });
  }
};

/**
 * @desc    Mark all user notifications as read
 * @route   PATCH /api/notifications/read-all
 * @access  Private (Logged-in user)
 */
export const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read.",
      data: null
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to mark all notifications as read.",
      data: null
    });
  }
};
