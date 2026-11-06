import express from "express";
import {
  createRequest,
  getMyRequests,
  getReceivedRequests,
  getRequestById,
  approveRequest,
  rejectRequest,
  cancelRequest,
  collectFood,
  distributeFood
} from "../controllers/requestController.js";
import {
  authenticate,
  authorize,
  requireVerifiedNGO
} from "../middleware/auth.js";

const router = express.Router();

// Submit a new food request (verified NGO / volunteer)
router.post(
  "/",
  authenticate,
  authorize("ngo", "volunteer"),
  requireVerifiedNGO,
  createRequest
);

// View requester's own requests (must precede /:id)
router.get("/my", authenticate, authorize("ngo", "volunteer"), getMyRequests);

// View requests received on donor's listings (must precede /:id)
router.get("/received", authenticate, authorize("donor"), getReceivedRequests);

// View specific request details (with contact info if approved)
router.get("/:id", authenticate, getRequestById);

// Donor approves request (atomic reservation)
router.patch("/:id/approve", authenticate, authorize("donor"), approveRequest);

// Donor rejects request
router.patch("/:id/reject", authenticate, authorize("donor"), rejectRequest);

// Requester cancels request (releases quantity if approved)
router.patch(
  "/:id/cancel",
  authenticate,
  authorize("ngo", "volunteer"),
  cancelRequest
);

// Donor or requester confirms food collection
router.patch("/:id/collect", authenticate, collectFood);

// Requester records distribution
router.patch(
  "/:id/distribute",
  authenticate,
  authorize("ngo", "volunteer"),
  distributeFood
);

export default router;
