import mongoose from "mongoose";
import FoodListing from "../models/FoodListing.js";

/**
 * @desc    Create a new food listing
 * @route   POST /api/food
 * @access  Private (Donor only)
 */
export const createFoodListing = async (req, res) => {
  try {
    const {
      foodName,
      description,
      category,
      quantity,
      unit,
      preparationTime,
      safePickupDeadline,
      storageConditions,
      foodSafetyDeclaration,
      pickupInstructions
    } = req.body;

    // Validate required foodName
    if (!foodName || typeof foodName !== "string" || !foodName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Food name is required.",
        data: null
      });
    }

    // Validate category
    const validCategories = ["cooked", "packaged", "fruits", "bakery", "other"];
    if (!category || !validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Allowed categories are: ${validCategories.join(", ")}.`,
        data: null
      });
    }

    // Validate quantity
    const parsedQuantity = Number(quantity);
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0.",
        data: null
      });
    }

    // Validate food safety declaration
    const isDeclared =
      foodSafetyDeclaration === true || foodSafetyDeclaration === "true";
    if (!isDeclared) {
      return res.status(400).json({
        success: false,
        message: "Food safety declaration must be accepted (must be true).",
        data: null
      });
    }

    // Validate preparationTime and safePickupDeadline
    if (!preparationTime) {
      return res.status(400).json({
        success: false,
        message: "Preparation time is required.",
        data: null
      });
    }

    if (!safePickupDeadline) {
      return res.status(400).json({
        success: false,
        message: "Safe pickup deadline is required.",
        data: null
      });
    }

    const prepDate = new Date(preparationTime);
    if (isNaN(prepDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid preparation time date format.",
        data: null
      });
    }

    const deadlineDate = new Date(safePickupDeadline);
    if (isNaN(deadlineDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid safe pickup deadline date format.",
        data: null
      });
    }

    if (deadlineDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Safe pickup deadline must be in the future.",
        data: null
      });
    }

    if (deadlineDate <= prepDate) {
      return res.status(400).json({
        success: false,
        message: "Safe pickup deadline must be after preparation time.",
        data: null
      });
    }

    // Image path
    let imagePath = "";
    if (req.file) {
      imagePath = `/uploads/${req.file.filename}`;
    } else if (req.body.image && typeof req.body.image === "string") {
      imagePath = req.body.image.trim();
    }

    const listing = await FoodListing.create({
      donorId: req.user._id,
      foodName: foodName.trim(),
      description: description ? String(description).trim() : "",
      category,
      image: imagePath,
      quantity: parsedQuantity,
      unit: unit ? String(unit).trim() : "servings",
      reservedQuantity: 0,
      collectedQuantity: 0,
      distributedQuantity: 0,
      preparationTime: prepDate,
      safePickupDeadline: deadlineDate,
      storageConditions: storageConditions ? String(storageConditions).trim() : "",
      foodSafetyDeclaration: true,
      pickupInstructions: pickupInstructions ? String(pickupInstructions).trim() : "",
      status: "available"
    });

    return res.status(201).json({
      success: true,
      message: "Food listing created successfully.",
      data: {
        listing
      }
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
        data: null
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create food listing.",
      data: null
    });
  }
};

/**
 * @desc    Get listings created by the logged-in donor
 * @route   GET /api/food/mine
 * @access  Private (Donor only)
 */
export const getMyListings = async (req, res) => {
  try {
    const filter = { donorId: req.user._id };

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const listings = await FoodListing.find(filter)
      .populate("donorId", "name email phone organizationName")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Donor food listings retrieved successfully.",
      data: {
        listings
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve your food listings.",
      data: null
    });
  }
};

/**
 * @desc    Get all available food listings for NGOs, volunteers, and admins
 *          Only returns listings with status 'available' or 'partially_reserved'
 *          and safePickupDeadline in the future.
 *          Never includes donor phone or pickup instructions.
 * @route   GET /api/food
 * @access  Private (NGO, Volunteer, Admin)
 */
export const getAvailableListings = async (req, res) => {
  try {
    const filter = {
      status: { $in: ["available", "partially_reserved"] },
      safePickupDeadline: { $gt: new Date() }
    };

    if (req.query.category) {
      filter.category = req.query.category;
    }

    if (req.query.search) {
      filter.foodName = { $regex: req.query.search.trim(), $options: "i" };
    }

    // Never include pickupInstructions or donor phone/email
    const listings = await FoodListing.find(filter)
      .select("-pickupInstructions")
      .populate("donorId", "name organizationName")
      .sort({ safePickupDeadline: 1 }); // Urgency sort

    return res.status(200).json({
      success: true,
      message: "Available food listings retrieved successfully.",
      data: {
        listings
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve available food listings.",
      data: null
    });
  }
};

/**
 * @desc    Get a single food listing by ID
 *          Donor contact details (phone, email, pickupInstructions) are revealed
 *          ONLY to the listing owner, admin, or an approved requester.
 * @route   GET /api/food/:id
 * @access  Private (Any logged-in user)
 */
export const getListingById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid food listing ID.",
        data: null
      });
    }

    const listing = await FoodListing.findById(id).populate(
      "donorId",
      "name email phone organizationName"
    );

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Food listing not found.",
        data: null
      });
    }

    // Determine contact visibility
    let canViewContact = false;

    if (req.user.role === "admin") {
      canViewContact = true;
    } else {
      const donorIdStr = listing.donorId?._id
        ? listing.donorId._id.toString()
        : listing.donorId.toString();

      if (donorIdStr === req.user._id.toString()) {
        canViewContact = true;
      } else if (mongoose.models.Request) {
        // Check if user has an approved request on this listing
        const Request = mongoose.model("Request");
        const approvedRequest = await Request.findOne({
          foodListingId: listing._id,
          requesterId: req.user._id,
          status: "approved"
        });

        if (approvedRequest) {
          canViewContact = true;
        }
      }
    }

    // If contact is not visible, sanitize donor contact and pickupInstructions
    if (!canViewContact) {
      const sanitized = listing.toJSON();
      delete sanitized.pickupInstructions;

      if (sanitized.donorId && typeof sanitized.donorId === "object") {
        delete sanitized.donorId.phone;
        delete sanitized.donorId.email;
      }

      return res.status(200).json({
        success: true,
        message: "Food listing retrieved successfully.",
        data: {
          listing: sanitized
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: "Food listing retrieved successfully.",
      data: {
        listing
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve food listing.",
      data: null
    });
  }
};

/**
 * @desc    Update a food listing
 *          Owner donor only; cannot reduce quantity below reservedQuantity
 * @route   PUT /api/food/:id
 * @access  Private (Owner Donor only)
 */
export const updateListing = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid food listing ID.",
        data: null
      });
    }

    const listing = await FoodListing.findById(id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Food listing not found.",
        data: null
      });
    }

    // Verify ownership
    if (listing.donorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only update your own food listings.",
        data: null
      });
    }

    // Check if listing is editable
    if (["completed", "cancelled", "expired"].includes(listing.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot edit a food listing with status '${listing.status}'.`,
        data: null
      });
    }

    // Check quantity reduction protection
    if (req.body.quantity !== undefined) {
      const newQuantity = Number(req.body.quantity);
      if (isNaN(newQuantity) || newQuantity <= 0) {
        return res.status(400).json({
          success: false,
          message: "Quantity must be greater than 0.",
          data: null
        });
      }

      if (newQuantity < listing.reservedQuantity) {
        return res.status(400).json({
          success: false,
          message: `Cannot reduce quantity (${newQuantity}) below already reserved quantity (${listing.reservedQuantity}).`,
          data: null
        });
      }

      listing.quantity = newQuantity;
    }

    // Check deadline and preparation time
    let updatedPrepTime = listing.preparationTime;
    if (req.body.preparationTime) {
      const parsedPrep = new Date(req.body.preparationTime);
      if (isNaN(parsedPrep.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid preparation time date format.",
          data: null
        });
      }
      updatedPrepTime = parsedPrep;
      listing.preparationTime = parsedPrep;
    }

    if (req.body.safePickupDeadline) {
      const parsedDeadline = new Date(req.body.safePickupDeadline);
      if (isNaN(parsedDeadline.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid safe pickup deadline date format.",
          data: null
        });
      }

      if (parsedDeadline <= new Date()) {
        return res.status(400).json({
          success: false,
          message: "Safe pickup deadline must be in the future.",
          data: null
        });
      }

      if (parsedDeadline <= updatedPrepTime) {
        return res.status(400).json({
          success: false,
          message: "Safe pickup deadline must be after preparation time.",
          data: null
        });
      }

      listing.safePickupDeadline = parsedDeadline;
    } else if (req.body.preparationTime && listing.safePickupDeadline <= updatedPrepTime) {
      return res.status(400).json({
        success: false,
        message: "Preparation time must be before safe pickup deadline.",
        data: null
      });
    }

    // Update image if new upload provided
    if (req.file) {
      listing.image = `/uploads/${req.file.filename}`;
    }

    // Update optional fields
    if (req.body.foodName) listing.foodName = req.body.foodName.trim();
    if (req.body.description !== undefined) listing.description = String(req.body.description).trim();
    if (req.body.unit !== undefined) listing.unit = String(req.body.unit).trim();
    if (req.body.storageConditions !== undefined)
      listing.storageConditions = String(req.body.storageConditions).trim();
    if (req.body.pickupInstructions !== undefined)
      listing.pickupInstructions = String(req.body.pickupInstructions).trim();

    if (req.body.category) {
      const validCategories = ["cooked", "packaged", "fruits", "bakery", "other"];
      if (!validCategories.includes(req.body.category)) {
        return res.status(400).json({
          success: false,
          message: `Invalid category. Allowed categories are: ${validCategories.join(", ")}.`,
          data: null
        });
      }
      listing.category = req.body.category;
    }

    // Adjust status dynamically based on updated quantity and reservedQuantity
    if (listing.quantity === listing.reservedQuantity && listing.reservedQuantity > 0) {
      listing.status = "fully_reserved";
    } else if (listing.reservedQuantity > 0 && listing.quantity > listing.reservedQuantity) {
      listing.status = "partially_reserved";
    } else if (listing.reservedQuantity === 0) {
      listing.status = "available";
    }

    await listing.save();

    return res.status(200).json({
      success: true,
      message: "Food listing updated successfully.",
      data: {
        listing
      }
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
        data: null
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update food listing.",
      data: null
    });
  }
};

/**
 * @desc    Cancel a food listing
 *          Owner donor only; sets status to 'cancelled'
 * @route   DELETE /api/food/:id
 * @access  Private (Owner Donor only)
 */
export const cancelListing = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid food listing ID.",
        data: null
      });
    }

    const listing = await FoodListing.findById(id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Food listing not found.",
        data: null
      });
    }

    // Verify ownership
    if (listing.donorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only cancel your own food listings.",
        data: null
      });
    }

    // Mark as cancelled
    listing.status = "cancelled";
    await listing.save();

    return res.status(200).json({
      success: true,
      message: "Food listing cancelled successfully.",
      data: {
        listing
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to cancel food listing.",
      data: null
    });
  }
};
