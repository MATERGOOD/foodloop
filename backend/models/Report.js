import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Reported by user ID is required"]
    },
    reportedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    foodListingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FoodListing",
      default: null
    },
    reason: {
      type: String,
      required: [true, "Reason is required"],
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ""
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "reviewed", "resolved", "dismissed"],
        message: "{VALUE} is not a valid report status"
      },
      default: "pending"
    },
    adminRemarks: {
      type: String,
      trim: true,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

reportSchema.index({ status: 1 });
reportSchema.index({ reportedBy: 1, createdAt: -1 });

const Report = mongoose.model("Report", reportSchema);

export default Report;
