import User from "../models/User.js";
import { generateUserToken } from "../utils/token.js";

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      role,
      organizationName,
      organizationDescription
    } = req.body;

    // Validate required fields
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required.",
        data: null
      });
    }

    if (!email || typeof email !== "string" || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
        data: null
      });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
        data: null
      });
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
        data: null
      });
    }

    // Role validation
    // Public registration may only create these roles. Admins are created via seed script.
const publicRoles = ["donor", "ngo", "volunteer"];
const userRole =
  typeof role === "string" && role.trim() ? role.toLowerCase().trim() : "donor";

if (!publicRoles.includes(userRole)) {
  return res.status(400).json({
    success: false,
    message: `Invalid role. Allowed roles are: ${publicRoles.join(", ")}.`,
    data: null
  });
}

// NGOs must provide an organization name so the admin can verify them
if (userRole === "ngo" && (!organizationName || !String(organizationName).trim())) {
  return res.status(400).json({
    success: false,
    message: "Organization name is required for NGO accounts.",
    data: null
  });
}
    const cleanEmail = email.toLowerCase().trim();

    // Check for existing user
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists.",
        data: null
      });
    }
    // Determine verification status
    // NGOs start as 'pending' awaiting admin verification; other roles are 'verified' by default
    const verificationStatus = userRole === "ngo" ? "pending" : "verified";

    // Create user
    const newUser = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password,
      phone: phone ? String(phone).trim() : "",
      role: userRole,
      organizationName: organizationName ? String(organizationName).trim() : "",
      organizationDescription: organizationDescription ? String(organizationDescription).trim() : "",
      verificationStatus,
      isActive: true
    });

    const token = generateUserToken(newUser);

    // Return response without password
    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      data: {
        token,
        user: newUser.toJSON()
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists.",
        data: null
      });
    }

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
      message: error.message || "Failed to register user.",
      data: null
    });
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide both email and password.",
        data: null
      });
    }

    const cleanEmail = String(email).toLowerCase().trim();

    // Query user and explicitly include password field
    const user = await User.findOne({ email: cleanEmail }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
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

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
        data: null
      });
    }

    const token = generateUserToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        token,
        user: user.toJSON()
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to log in.",
      data: null
    });
  }
};

/**
 * @desc    Get current authenticated user profile
 * @route   GET /api/auth/me
 * @access  Private (Authenticated users)
 */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User profile not found.",
        data: null
      });
    }

    return res.status(200).json({
      success: true,
      message: "User profile retrieved successfully.",
      data: {
        user: user.toJSON()
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve user profile.",
      data: null
    });
  }
};
