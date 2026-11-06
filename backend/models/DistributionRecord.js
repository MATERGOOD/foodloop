import mongoose from "mongoose";

const distributionRecordSchema = new mongoose.Schema(
  {
    foodListingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FoodListing",
      required: [true, "Food listing ID is required"]
    },
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Request",
      required: [true, "Request ID is required"]
    },
    distributorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Distributor ID is required"]
    },
    quantityDistributed: {
      type: Number,
      required: [true, "Quantity distributed is required"],
      min: [0.01, "Quantity distributed must be greater than 0"]
    },
    beneficiaryCount: {
      type: Number,
      required: [true, "Beneficiary count is required"],
      min: [0, "Beneficiary count cannot be negative"]
    },
    distributionNotes: {
      type: String,
      trim: true,
      default: ""
    },
    distributedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

distributionRecordSchema.index({ foodListingId: 1 });
distributionRecordSchema.index({ requestId: 1 });
distributionRecordSchema.index({ distributorId: 1, createdAt: -1 });

const DistributionRecord = mongoose.model(
  "DistributionRecord",
  distributionRecordSchema
);

export default DistributionRecord;
