import User from "../models/User.js";
import { verifyToken } from "../utils/token.js";

/**
 * Middleware to authenticate requests via JWT Bearer token
 */
export const authenticate = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authorization token required. Access denied.",
        data: null
      });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Token has expired. Please log in again.",
          data: null
        });
      }
      return res.status(401).json({
        success: false,
        message: "Invalid authorization token.",
        data: null
      });
    }

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User belonging to this token no longer exists.",
        data: null
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account has been deactivated. Please contact support.",
        data: null
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal authentication error.",
      data: null
    });
  }
};

// Protect alias
export const protect = authenticate;

/**
 * Middleware to restrict access based on user role(s)
 * @param  {...string} roles - Allowed roles e.g. 'donor', 'ngo', 'volunteer', 'admin'
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required before role verification.",
        data: null
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user.role}' is not authorized to access this resource.`,
        data: null
      });
    }

    next();
  };
};

// CheckRole alias
export const checkRole = authorize;

/**
 * Helper middleware to ensure an NGO has been verified by admin
 */
export const requireVerifiedNGO = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
      data: null
    });
  }

  if (req.user.role === "ngo" && req.user.verificationStatus !== "verified") {
    return res.status(403).json({
      success: false,
      message: "NGO account is pending admin verification. Access restricted.",
      data: null
    });
  }

  next();
};
