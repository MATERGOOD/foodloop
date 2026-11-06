import mongoose from "mongoose";
import Request from "../models/Request.js";
import FoodListing from "../models/FoodListing.js";
import DistributionRecord from "../models/DistributionRecord.js";
import { createNotification } from "../services/notificationService.js";

/**
 * Helper to sanitize food listing and donor contact info
 * unless user is authorized to see it.
 */
const sanitizeRequestContact = (requestObj, currentUserId, currentUserRole) => {
  const reqCopy = JSON.parse(JSON.stringify(requestObj));
  if (!reqCopy.foodListingId) return reqCopy;

  const donor = reqCopy.foodListingId.donorId;
  const donorIdStr = donor?._id ? donor._id.toString() : donor?.toString();
  const requesterIdStr = reqCopy.requesterId?._id
    ? reqCopy.requesterId._id.toString()
    : reqCopy.requesterId?.toString();

  const isAdmin = currentUserRole === "admin";
  const isOwner = donorIdStr === currentUserId.toString();
  const isApprovedRequester =
    requesterIdStr === currentUserId.toString() &&
    ["approved", "collected", "distributed"].includes(reqCopy.status);

  if (!isAdmin && !isOwner && !isApprovedRequester) {
    if (reqCopy.foodListingId.pickupInstructions !== undefined) {
      delete reqCopy.foodListingId.pickupInstructions;
    }
    if (donor && typeof donor === "object") {
      delete donor.phone;
      delete donor.email;
    }
  }

  return reqCopy;
};

/**
 * @desc    Submit a food request
 * @route   POST /api/requests
 * @access  Private (Verified NGO / Volunteer)
 */
export const createRequest = async (req, res) => {
  try {
    const { foodListingId, requestedQuantity, message } = req.body;

    if (!foodListingId || !mongoose.Types.ObjectId.isValid(foodListingId)) {
      return res.status(400).json({
        success: false,
        message: "Valid food listing ID is required.",
        data: null
      });
    }

    const qty = Number(requestedQuantity);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: "Requested quantity must be greater than 0.",
        data: null
      });
    }

    const listing = await FoodListing.findById(foodListingId);
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Food listing not found.",
        data: null
      });
    }

    // Role separation: cannot request own listing
    if (listing.donorId.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot request your own food listing.",
        data: null
      });
    }

    // Check listing status and deadline
    if (!["available", "partially_reserved"].includes(listing.status)) {
      return res.status(400).json({
        success: false,
        message: `This listing is ${listing.status} and cannot accept requests.`,
        data: null
      });
    }

    if (new Date(listing.safePickupDeadline) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "This food listing has expired and cannot accept requests.",
        data: null
      });
    }

    const availableQuantity = listing.quantity - (listing.reservedQuantity || 0);
    if (qty > availableQuantity) {
      return res.status(400).json({
        success: false,
        message: `Requested quantity (${qty}) exceeds available quantity (${availableQuantity} ${listing.unit}).`,
        data: null
      });
    }

    // Check for duplicate pending/approved request
    const existing = await Request.findOne({
      foodListingId,
      requesterId: req.user._id,
      status: { $in: ["pending", "approved"] }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `You already have an active (${existing.status}) request for this listing.`,
        data: null
      });
    }

    const request = await Request.create({
      foodListingId,
      requesterId: req.user._id,
      requestedQuantity: qty,
      message: message ? String(message).trim() : "",
      status: "pending"
    });

    // Notify donor
    await createNotification({
      userId: listing.donorId,
      title: "New Food Request",
      message: `${req.user.name} requested ${qty} ${listing.unit} of "${listing.foodName}".`,
      type: "request_received",
      relatedListingId: listing._id,
      relatedRequestId: request._id
    });

    return res.status(201).json({
      success: true,
      message: "Food request submitted successfully.",
      data: {
        request
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to submit request.",
      data: null
    });
  }
};

/**
 * @desc    Get requests made by the logged-in requester
 * @route   GET /api/requests/my
 * @access  Private (NGO / Volunteer)
 */
export const getMyRequests = async (req, res) => {
  try {
    const filter = { requesterId: req.user._id };
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const requests = await Request.find(filter)
      .populate({
        path: "foodListingId",
        populate: {
          path: "donorId",
          select: "name phone email organizationName"
        }
      })
      .sort({ createdAt: -1 });

    // Contact visibility check for each request
    const sanitizedRequests = requests.map((r) =>
      sanitizeRequestContact(r.toJSON(), req.user._id, req.user.role)
    );

    return res.status(200).json({
      success: true,
      message: "My requests retrieved successfully.",
      data: {
        requests: sanitizedRequests
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve your requests.",
      data: null
    });
  }
};

/**
 * @desc    Get requests received on donor's listings
 * @route   GET /api/requests/received
 * @access  Private (Donor)
 */
export const getReceivedRequests = async (req, res) => {
  try {
    const donorListings = await FoodListing.find({ donorId: req.user._id }).select("_id");
    const listingIds = donorListings.map((l) => l._id);

    const filter = { foodListingId: { $in: listingIds } };
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const requests = await Request.find(filter)
      .populate("foodListingId")
      .populate("requesterId", "name email phone role organizationName verificationStatus")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Received requests retrieved successfully.",
      data: {
        requests
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve received requests.",
      data: null
    });
  }
};

/**
 * @desc    Get single request details (with contact info if approved)
 * @route   GET /api/requests/:id
 * @access  Private (Owner Donor, Admin, or Requester)
 */
export const getRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request ID.",
        data: null
      });
    }

    const request = await Request.findById(id)
      .populate({
        path: "foodListingId",
        populate: {
          path: "donorId",
          select: "name phone email organizationName"
        }
      })
      .populate("requesterId", "name email phone role organizationName verificationStatus");

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found.",
        data: null
      });
    }

    const donorId = request.foodListingId?.donorId?._id?.toString() ||
      request.foodListingId?.donorId?.toString();
    const requesterId = request.requesterId?._id?.toString() ||
      request.requesterId?.toString();
    const currentUserId = req.user._id.toString();

    const isAuthorized =
      req.user.role === "admin" ||
      donorId === currentUserId ||
      requesterId === currentUserId;

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You are not authorized to view this request.",
        data: null
      });
    }

    const sanitized = sanitizeRequestContact(
      request.toJSON(),
      req.user._id,
      req.user.role
    );

    return res.status(200).json({
      success: true,
      message: "Request retrieved successfully.",
      data: {
        request: sanitized
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve request.",
      data: null
    });
  }
};

/**
 * @desc    Approve a food request (atomic quantity reservation)
 * @route   PATCH /api/requests/:id/approve
 * @access  Private (Owner Donor)
 */
export const approveRequest = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request ID.",
        data: null
      });
    }

    const request = await Request.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found.",
        data: null
      });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Cannot approve request with status '${request.status}'.`,
        data: null
      });
    }

    const listing = await FoodListing.findById(request.foodListingId);
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Associated food listing not found.",
        data: null
      });
    }

    // Role check: only listing owner can approve
    if (listing.donorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only the listing owner can approve this request.",
        data: null
      });
    }

    if (["expired", "cancelled", "completed"].includes(listing.status)) {
      return res.status(400).json({
        success: false,
        message: `Listing is ${listing.status} and cannot accept approvals.`,
        data: null
      });
    }

    if (new Date(listing.safePickupDeadline) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Listing deadline has passed. Cannot approve requests.",
        data: null
      });
    }

    // ATOMIC conditional update: ensure quantity - reservedQuantity >= requestedQuantity
    const updatedListing = await FoodListing.findOneAndUpdate(
      {
        _id: listing._id,
        status: { $in: ["available", "partially_reserved"] },
        safePickupDeadline: { $gt: new Date() },
        $expr: {
          $gte: [
            { $subtract: ["$quantity", "$reservedQuantity"] },
            request.requestedQuantity
          ]
        }
      },
      [
        {
          $set: {
            reservedQuantity: { $add: ["$reservedQuantity", request.requestedQuantity] },
            status: {
              $cond: {
                if: {
                  $eq: [
                    { $add: ["$reservedQuantity", request.requestedQuantity] },
                    "$quantity"
                  ]
                },
                then: "fully_reserved",
                else: "partially_reserved"
              }
            }
          }
        }
      ],
      { new: true }
    );

    if (!updatedListing) {
      return res.status(400).json({
        success: false,
        message: "Cannot approve request: insufficient remaining quantity or listing deadline passed.",
        data: null
      });
    }

    request.status = "approved";
    request.donorDecisionAt = new Date();
    await request.save();

    // Notify requester
    await createNotification({
      userId: request.requesterId,
      title: "Request Approved!",
      message: `Your request for ${request.requestedQuantity} ${listing.unit} of "${listing.foodName}" has been approved! You can now view pickup instructions and contact details.`,
      type: "request_approved",
      relatedListingId: listing._id,
      relatedRequestId: request._id
    });

    const populatedRequest = await Request.findById(request._id)
      .populate({
        path: "foodListingId",
        populate: {
          path: "donorId",
          select: "name phone email organizationName"
        }
      })
      .populate("requesterId", "name email phone role organizationName");

    return res.status(200).json({
      success: true,
      message: "Request approved successfully.",
      data: {
        request: populatedRequest,
        listing: updatedListing
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to approve request.",
      data: null
    });
  }
};

/**
 * @desc    Reject a food request
 * @route   PATCH /api/requests/:id/reject
 * @access  Private (Owner Donor)
 */
export const rejectRequest = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request ID.",
        data: null
      });
    }

    const request = await Request.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found.",
        data: null
      });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Cannot reject request with status '${request.status}'.`,
        data: null
      });
    }

    const listing = await FoodListing.findById(request.foodListingId);
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Associated food listing not found.",
        data: null
      });
    }

    // Role check: only listing owner can reject
    if (listing.donorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only the listing owner can reject this request.",
        data: null
      });
    }

    request.status = "rejected";
    request.donorDecisionAt = new Date();
    await request.save();

    // Notify requester
    await createNotification({
      userId: request.requesterId,
      title: "Request Declined",
      message: `Your request for "${listing.foodName}" was declined by the donor.`,
      type: "request_rejected",
      relatedListingId: listing._id,
      relatedRequestId: request._id
    });

    return res.status(200).json({
      success: true,
      message: "Request rejected successfully.",
      data: {
        request
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to reject request.",
      data: null
    });
  }
};

/**
 * @desc    Cancel a request (releases quantity if approved)
 * @route   PATCH /api/requests/:id/cancel
 * @access  Private (Requester only)
 */
export const cancelRequest = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request ID.",
        data: null
      });
    }

    const request = await Request.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found.",
        data: null
      });
    }

    // Role check: only the requester can cancel
    if (request.requesterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only cancel your own requests.",
        data: null
      });
    }

    if (["cancelled", "rejected", "collected", "distributed"].includes(request.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a request with status '${request.status}'.`,
        data: null
      });
    }

    const wasApproved = request.status === "approved";
    request.status = "cancelled";
    await request.save();

    // If request was approved, release reserved quantity
    if (wasApproved) {
      const updatedListing = await FoodListing.findByIdAndUpdate(
        request.foodListingId,
        [
          {
            $set: {
              reservedQuantity: {
                $max: [0, { $subtract: ["$reservedQuantity", request.requestedQuantity] }]
              },
              status: {
                $cond: {
                  if: {
                    $eq: [
                      { $max: [0, { $subtract: ["$reservedQuantity", request.requestedQuantity] }] },
                      0
                    ]
                  },
                  then: "available",
                  else: "partially_reserved"
                }
              }
            }
          }
        ],
        { new: true }
      );

      if (updatedListing) {
        // Notify donor of cancellation and quantity release
        await createNotification({
          userId: updatedListing.donorId,
          title: "Approved Request Cancelled",
          message: `${req.user.name} cancelled their approved request for ${request.requestedQuantity} ${updatedListing.unit}. The reserved quantity has been released.`,
          type: "request_cancelled",
          relatedListingId: updatedListing._id,
          relatedRequestId: request._id
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Request cancelled successfully.",
      data: {
        request
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to cancel request.",
      data: null
    });
  }
};

/**
 * @desc    Confirm food handover / collection
 * @route   PATCH /api/requests/:id/collect
 * @access  Private (Donor owner or Requester)
 */
export const collectFood = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request ID.",
        data: null
      });
    }

    const request = await Request.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found.",
        data: null
      });
    }

    if (request.status !== "approved") {
      return res.status(400).json({
        success: false,
        message: `Only approved requests can be collected. Current status: '${request.status}'.`,
        data: null
      });
    }

    const listing = await FoodListing.findById(request.foodListingId);
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Associated food listing not found.",
        data: null
      });
    }

    const isOwner = listing.donorId.toString() === req.user._id.toString();
    const isRequester = request.requesterId.toString() === req.user._id.toString();

    if (!isOwner && !isRequester) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only the donor or requester can confirm collection.",
        data: null
      });
    }

    request.status = "collected";
    request.collectedAt = new Date();
    await request.save();

    listing.collectedQuantity = (listing.collectedQuantity || 0) + request.requestedQuantity;
    await listing.save();

    // Notify other party
    const targetUserId = isOwner ? request.requesterId : listing.donorId;
    await createNotification({
      userId: targetUserId,
      title: "Food Collection Confirmed",
      message: `Collection of ${request.requestedQuantity} ${listing.unit} of "${listing.foodName}" has been confirmed.`,
      type: "food_collected",
      relatedListingId: listing._id,
      relatedRequestId: request._id
    });

    return res.status(200).json({
      success: true,
      message: "Food collection confirmed successfully.",
      data: {
        request,
        listing
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to confirm collection.",
      data: null
    });
  }
};

/**
 * @desc    Record distribution of collected food
 * @route   PATCH /api/requests/:id/distribute
 * @access  Private (Requester only)
 */
export const distributeFood = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantityDistributed, beneficiaryCount, distributionNotes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request ID.",
        data: null
      });
    }

    const request = await Request.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found.",
        data: null
      });
    }

    if (request.requesterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only the requester can record distribution.",
        data: null
      });
    }

    if (request.status !== "collected") {
      return res.status(400).json({
        success: false,
        message: `Food must be in 'collected' status before distribution. Current status: '${request.status}'.`,
        data: null
      });
    }

    const qtyDist = Number(quantityDistributed);
    if (isNaN(qtyDist) || qtyDist <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity distributed must be greater than 0.",
        data: null
      });
    }

    // Critical rule: Distributed quantity cannot exceed collected quantity
    if (qtyDist > request.requestedQuantity) {
      return res.status(400).json({
        success: false,
        message: `Distributed quantity (${qtyDist}) cannot exceed collected quantity (${request.requestedQuantity}).`,
        data: null
      });
    }

    const benefCount = Number(beneficiaryCount);
    if (isNaN(benefCount) || benefCount < 0) {
      return res.status(400).json({
        success: false,
        message: "Beneficiary count cannot be negative.",
        data: null
      });
    }

    const listing = await FoodListing.findById(request.foodListingId);
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Associated food listing not found.",
        data: null
      });
    }

    // Create distribution record
    const record = await DistributionRecord.create({
      foodListingId: listing._id,
      requestId: request._id,
      distributorId: req.user._id,
      quantityDistributed: qtyDist,
      beneficiaryCount: benefCount,
      distributionNotes: distributionNotes ? String(distributionNotes).trim() : "",
      distributedAt: new Date()
    });

    request.status = "distributed";
    request.distributedAt = new Date();
    await request.save();

    // Update listing distributed quantity
    listing.distributedQuantity = (listing.distributedQuantity || 0) + qtyDist;

    // Check if listing is completed (all distributed or quantity reached)
    if (listing.distributedQuantity >= listing.quantity) {
      listing.status = "completed";
    }
    await listing.save();

    // Notify donor
    await createNotification({
      userId: listing.donorId,
      title: "Food Successfully Distributed",
      message: `${qtyDist} ${listing.unit} of "${listing.foodName}" was distributed to ${benefCount} beneficiaries!`,
      type: "food_distributed",
      relatedListingId: listing._id,
      relatedRequestId: request._id
    });

    return res.status(200).json({
      success: true,
      message: "Food distribution recorded successfully.",
      data: {
        request,
        distributionRecord: record
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to record distribution.",
      data: null
    });
  }
};
