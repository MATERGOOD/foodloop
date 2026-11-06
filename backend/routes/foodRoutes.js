import express from "express";
import {
  createFoodListing,
  getMyListings,
  getAvailableListings,
  getListingById,
  updateListing,
  cancelListing
} from "../controllers/foodController.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { uploadFoodImage } from "../middleware/upload.js";

const router = express.Router();

// Donor creates a new food listing (with optional image upload)
router.post("/", authenticate, authorize("donor"), uploadFoodImage, createFoodListing);

// Donor views their own listings (must be defined before /:id)
router.get("/mine", authenticate, authorize("donor"), getMyListings);

// NGOs, volunteers, and admins browse available food listings
router.get("/", authenticate, authorize("ngo", "volunteer", "admin"), getAvailableListings);

// View specific food listing details (contact info revealed only to owner, admin, or approved requester)
router.get("/:id", authenticate, getListingById);

// Donor updates their own food listing (cannot reduce quantity below reservedQuantity)
router.put("/:id", authenticate, authorize("donor"), uploadFoodImage, updateListing);

// Donor cancels their own food listing (sets status to 'cancelled')
router.delete("/:id", authenticate, authorize("donor"), cancelListing);

export default router;
