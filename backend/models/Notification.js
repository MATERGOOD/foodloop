import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"]
    },
    title: {
      type: String,
      required: [true, "Notification title is required"],
      trim: true
    },
    message: {
      type: String,
      required: [true, "Notification message is required"],
      trim: true
    },
    type: {
      type: String,
      enum: [
        "request_received",
        "request_approved",
        "request_rejected",
        "request_cancelled",
        "food_collected",
        "food_distributed",
        "listing_expired",
        "verification_status",
        "general"
      ],
      default: "general"
    },
    relatedListingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FoodListing",
      default: null
    },
    relatedRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Request",
      default: null
    },
    isRead: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Index per SPEC.md: notification userId + isRead
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
