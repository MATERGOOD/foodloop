import mongoose from "mongoose";
import User from "../models/User.js";
import FoodListing from "../models/FoodListing.js";
import Request from "../models/Request.js";
import DistributionRecord from "../models/DistributionRecord.js";
import Report from "../models/Report.js";
import { createNotification } from "../services/notificationService.js";

/**
 * @desc    Get aggregate statistics for the admin dashboard
 * @route   GET /api/admin/dashboard
 * @access  Private (Admin only)
 */
export const getDashboardStats = async (req, res) => {
  try {
    // User counts
    const [
      totalUsers,
      pendingNgosCount,
      usersByRole,
      listingsByStatus,
      requestsByStatus,
      foodTotals,
      beneficiariesResult,
      pendingReportsCount
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "ngo", verificationStatus: "pending" }),
      User.aggregate([
        { $group: { _id: "$role", count: { $sum: 1 } } }
      ]),
      FoodListing.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]),
      Request.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]),
      FoodListing.aggregate([
        {
          $group: {
            _id: null,
            totalQuantityListed: { $sum: "$quantity" },
            totalQuantityReserved: { $sum: "$reservedQuantity" },
            totalQuantityCollected: { $sum: "$collectedQuantity" },
            totalQuantityDistributed: { $sum: "$distributedQuantity" }
          }
        }
      ]),
      DistributionRecord.aggregate([
        {
          $group: {
            _id: null,
            totalBeneficiaries: { $sum: "$beneficiaryCount" },
            totalDistributions: { $sum: 1 }
          }
        }
      ]),
      Report.countDocuments({ status: "pending" })
    ]);

    const usersRoleMap = {};
    usersByRole.forEach((r) => {
      usersRoleMap[r._id] = r.count;
    });

    const listingsStatusMap = {};
    listingsByStatus.forEach((s) => {
      listingsStatusMap[s._id] = s.count;
    });

    const requestsStatusMap = {};
    requestsByStatus.forEach((s) => {
      requestsStatusMap[s._id] = s.count;
    });

    const totals = foodTotals[0] || {
      totalQuantityListed: 0,
      totalQuantityReserved: 0,
      totalQuantityCollected: 0,
      totalQuantityDistributed: 0
    };

    const beneficiaryStats = beneficiariesResult[0] || {
      totalBeneficiaries: 0,
      totalDistributions: 0
    };

    return res.status(200).json({
      success: true,
      message: "Admin dashboard statistics retrieved successfully.",
      data: {
        users: {
          total: totalUsers,
          pendingNgos: pendingNgosCount,
          byRole: usersRoleMap
        },
        listings: {
          total: Object.values(listingsStatusMap).reduce((a, b) => a + b, 0),
          byStatus: listingsStatusMap,
          quantity: totals
        },
        requests: {
          total: Object.values(requestsStatusMap).reduce((a, b) => a + b, 0),
          byStatus: requestsStatusMap
        },
        impact: {
          totalBeneficiariesServed: beneficiaryStats.totalBeneficiaries,
          totalDistributionEvents: beneficiaryStats.totalDistributions,
          totalMealsDistributed: totals.totalQuantityDistributed
        },
        pendingReports: pendingReportsCount
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve dashboard stats.",
      data: null
    });
  }
};

/**
 * @desc    Get all users with optional filtering
 * @route   GET /api/admin/users
 * @access  Private (Admin only)
 */
export const getUsers = async (req, res) => {
  try {
    const filter = {};

    if (req.query.role) {
      filter.role = req.query.role;
    }

    if (req.query.verificationStatus) {
      filter.verificationStatus = req.query.verificationStatus;
    }

    if (req.query.search) {
      const regex = new RegExp(req.query.search.trim(), "i");
      filter.$or = [{ name: regex }, { email: regex }, { organizationName: regex }];
    }

    const users = await User.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Users retrieved successfully.",
      data: {
        users
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve users.",
      data: null
    });
  }
};

/**
 * @desc    Verify or reject an NGO user
 * @route   PATCH /api/admin/users/:id/verify
 * @access  Private (Admin only)
 */
export const verifyUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { verificationStatus } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
        data: null
      });
    }

    if (!["verified", "rejected", "pending"].includes(verificationStatus)) {
      return res.status(400).json({
        success: false,
        message: "Verification status must be 'verified', 'rejected', or 'pending'.",
        data: null
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
        data: null
      });
    }

    user.verificationStatus = verificationStatus;
    await user.save();

    // Notify user of verification status change
    await createNotification({
      userId: user._id,
      title: "Organization Verification Update",
      message: `Your organization verification status has been set to: ${verificationStatus}.`,
      type: "verification_status"
    });

    return res.status(200).json({
      success: true,
      message: `User verification status updated to '${verificationStatus}'.`,
      data: {
        user
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update verification status.",
      data: null
    });
  }
};

/**
 * @desc    Update a report status and admin remarks
 * @route   PATCH /api/admin/reports/:id
 * @access  Private (Admin only)
 */
export const updateReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminRemarks } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid report ID.",
        data: null
      });
    }

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found.",
        data: null
      });
    }

    if (status) {
      const validStatuses = ["pending", "reviewed", "resolved", "dismissed"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Allowed values: ${validStatuses.join(", ")}.`,
          data: null
        });
      }
      report.status = status;
    }

    if (adminRemarks !== undefined) {
      report.adminRemarks = String(adminRemarks).trim();
    }

    await report.save();

    return res.status(200).json({
      success: true,
      message: "Report updated successfully.",
      data: {
        report
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update report.",
      data: null
    });
  }
};

/**
 * @desc    Get all reports (with optional status filter)
 * @route   GET /api/admin/reports
 * @access  Private (Admin only)
 */
export const getAllReports = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const reports = await Report.find(filter)
      .populate("reportedBy", "name email role")
      .populate("reportedUserId", "name email role organizationName")
      .populate("foodListingId", "foodName status")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Reports retrieved successfully.",
      data: {
        reports
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve reports.",
      data: null
    });
  }
};
