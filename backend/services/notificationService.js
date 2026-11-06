import Notification from "../models/Notification.js";

/**
 * Helper service to create user notifications
 */
export const createNotification = async ({
  userId,
  title,
  message,
  type = "general",
  relatedListingId = null,
  relatedRequestId = null
}) => {
  try {
    return await Notification.create({
      userId,
      title,
      message,
      type,
      relatedListingId,
      relatedRequestId
    });
  } catch (error) {
    console.error("Failed to create notification:", error.message);
    return null;
  }
};
