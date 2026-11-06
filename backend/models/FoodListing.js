import mongoose from "mongoose";

const foodListingSchema = new mongoose.Schema(
  {
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Donor ID is required"]
    },
    foodName: {
      type: String,
      required: [true, "Food name is required"],
      trim: true,
      maxlength: [150, "Food name cannot exceed 150 characters"]
    },
    description: {
      type: String,
      trim: true,
      default: ""
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: ["cooked", "packaged", "fruits", "bakery", "other"],
        message: "{VALUE} is not a valid food category"
      }
    },
    image: {
      type: String,
      default: ""
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0.01, "Quantity must be greater than 0"]
    },
    unit: {
      type: String,
      trim: true,
      default: "servings"
    },
    reservedQuantity: {
      type: Number,
      default: 0,
      min: [0, "Reserved quantity cannot be negative"]
    },
    collectedQuantity: {
      type: Number,
      default: 0,
      min: [0, "Collected quantity cannot be negative"]
    },
    distributedQuantity: {
      type: Number,
      default: 0,
      min: [0, "Distributed quantity cannot be negative"]
    },
    preparationTime: {
      type: Date,
      required: [true, "Preparation time is required"]
    },
    safePickupDeadline: {
      type: Date,
      required: [true, "Safe pickup deadline is required"],
      validate: {
        validator: function (value) {
          if (!this.preparationTime || !value) return true;
          return new Date(value) > new Date(this.preparationTime);
        },
        message: "Safe pickup deadline must be after preparation time"
      }
    },
    storageConditions: {
      type: String,
      trim: true,
      default: ""
    },
    foodSafetyDeclaration: {
      type: Boolean,
      required: [true, "Food safety declaration is required"],
      validate: {
        validator: function (v) {
          return v === true;
        },
        message: "Food safety declaration must be accepted (must be true)"
      }
    },
    pickupInstructions: {
      type: String,
      trim: true,
      default: ""
    },
    status: {
      type: String,
      enum: {
        values: [
          "available",
          "partially_reserved",
          "fully_reserved",
          "completed",
          "expired",
          "cancelled"
        ],
        message: "{VALUE} is not a valid status"
      },
      default: "available"
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual property to calculate available quantity
foodListingSchema.virtual("availableQuantity").get(function () {
  return Math.max(0, this.quantity - (this.reservedQuantity || 0));
});

// Indexes per SPEC.md: status + safePickupDeadline, plus donorId for fast lookup
foodListingSchema.index({ status: 1, safePickupDeadline: 1 });
foodListingSchema.index({ donorId: 1, createdAt: -1 });

const FoodListing = mongoose.model("FoodListing", foodListingSchema);

export default FoodListing;
