import mongoose from "mongoose";
import Report from "../models/Report.js";

/**
 * @desc    Submit a report regarding a user or listing
 * @route   POST /api/reports
 * @access  Private (Logged-in user)
 */
export const createReport = async (req, res) => {
  try {
    const { reportedUserId, foodListingId, reason, description } = req.body;

    if (!reason || typeof reason !== "string" || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: "Reason for report is required.",
        data: null
      });
    }

    if (
      reportedUserId &&
      !mongoose.Types.ObjectId.isValid(reportedUserId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid reported user ID.",
        data: null
      });
    }

    if (
      foodListingId &&
      !mongoose.Types.ObjectId.isValid(foodListingId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid food listing ID.",
        data: null
      });
    }

    const report = await Report.create({
      reportedBy: req.user._id,
      reportedUserId: reportedUserId || null,
      foodListingId: foodListingId || null,
      reason: reason.trim(),
      description: description ? String(description).trim() : "",
      status: "pending"
    });

    return res.status(201).json({
      success: true,
      message: "Report submitted successfully. Our team will review it.",
      data: {
        report
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to submit report.",
      data: null
    });
  }
};

/**
 * @desc    Get reports submitted by current user
 * @route   GET /api/reports/my
 * @access  Private (Logged-in user)
 */
export const getMyReports = async (req, res) => {
  try {
    const reports = await Report.find({ reportedBy: req.user._id })
      .populate("reportedUserId", "name email role")
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
