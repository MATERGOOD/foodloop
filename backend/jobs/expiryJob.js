import cron from "node-cron";
import FoodListing from "../models/FoodListing.js";
import Request from "../models/Request.js";
import { createNotification } from "../services/notificationService.js";

/**
 * Runs the expiry check routine.
 * Finds all active listings that have passed safePickupDeadline,
 * marks them as 'expired', and handles approved uncollected requests.
 */
export const checkExpiredListings = async () => {
  try {
    const now = new Date();

    // Find listings past deadline that are not yet expired, completed, or cancelled
    const expiredListings = await FoodListing.find({
      status: { $in: ["available", "partially_reserved", "fully_reserved"] },
      safePickupDeadline: { $lte: now }
    });

    if (expiredListings.length === 0) {
      return;
    }

    console.log(`[ExpiryJob] Processing ${expiredListings.length} expired listing(s)...`);

    for (const listing of expiredListings) {
      listing.status = "expired";
      await listing.save();

      // Check for approved-but-uncollected requests on this listing
      const uncollectedApprovedRequests = await Request.find({
        foodListingId: listing._id,
        status: "approved"
      });

      if (uncollectedApprovedRequests.length > 0) {
        // Flag for donor review via notification
        await createNotification({
          userId: listing.donorId,
          title: "Listing Expired - Uncollected Requests Flagged",
          message: `Your listing "${listing.foodName}" has passed its pickup deadline with ${uncollectedApprovedRequests.length} uncollected request(s). Please review.`,
          type: "listing_expired",
          relatedListingId: listing._id
        });

        // Notify requesters who had approved requests that listing has expired
        for (const req of uncollectedApprovedRequests) {
          await createNotification({
            userId: req.requesterId,
            title: "Pickup Deadline Passed",
            message: `The pickup deadline for "${listing.foodName}" has passed before collection was confirmed.`,
            type: "listing_expired",
            relatedListingId: listing._id,
            relatedRequestId: req._id
          });
        }
      }

      // Reject/notify any pending requests
      const pendingRequests = await Request.find({
        foodListingId: listing._id,
        status: "pending"
      });

      for (const req of pendingRequests) {
        req.status = "rejected";
        req.donorDecisionAt = now;
        await req.save();

        await createNotification({
          userId: req.requesterId,
          title: "Listing Expired",
          message: `Your pending request for "${listing.foodName}" was closed because the listing reached its deadline.`,
          type: "listing_expired",
          relatedListingId: listing._id,
          relatedRequestId: req._id
        });
      }
    }
  } catch (error) {
    console.error("[ExpiryJob] Error running expiry check:", error.message);
  }
};

/**
 * Initialize node-cron expiry job running every minute
 */
export const initExpiryJob = () => {
  // Run every minute: "* * * * *"
  const job = cron.schedule("* * * * *", () => {
    checkExpiredListings();
  });

  console.log("[ExpiryJob] Node-cron listing expiry job scheduled (every minute).");
  return job;
};

export default initExpiryJob;
