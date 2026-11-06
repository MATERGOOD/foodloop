import mongoose from "mongoose";

const requestSchema = new mongoose.Schema(
  {
    foodListingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FoodListing",
      required: [true, "Food listing ID is required"]
    },
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Requester ID is required"]
    },
    requestedQuantity: {
      type: Number,
      required: [true, "Requested quantity is required"],
      min: [0.01, "Requested quantity must be greater than 0"]
    },
    message: {
      type: String,
      trim: true,
      default: ""
    },
    status: {
      type: String,
      enum: {
        values: [
          "pending",
          "approved",
          "rejected",
          "cancelled",
          "collected",
          "distributed"
        ],
        message: "{VALUE} is not a valid request status"
      },
      default: "pending"
    },
    donorDecisionAt: {
      type: Date,
      default: null
    },
    collectedAt: {
      type: Date,
      default: null
    },
    distributedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Compound index per SPEC.md: request foodListingId + requesterId
requestSchema.index({ foodListingId: 1, requesterId: 1 });
requestSchema.index({ status: 1 });
requestSchema.index({ requesterId: 1, createdAt: -1 });

const Request = mongoose.model("Request", requestSchema);

export default Request;
