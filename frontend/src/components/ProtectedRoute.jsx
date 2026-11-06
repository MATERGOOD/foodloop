import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const ProtectedRoute = ({ children, allowedRoles, requireVerified = false }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Verifying authentication...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role authorization
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="access-denied-container">
        <h2>Access Denied</h2>
        <p>
          Your account role (<strong>{user.role}</strong>) does not have permission
          to access this page.
        </p>
        <p>Allowed roles: {allowedRoles.join(", ")}</p>
      </div>
    );
  }

  // Check NGO verification requirement if specified
  if (
    requireVerified &&
    user.role === "ngo" &&
    user.verificationStatus !== "verified"
  ) {
    return (
      <div className="verification-pending-container">
        <div className="alert-card alert-warning">
          <h3>Verification Pending</h3>
          <p>
            Your NGO account (<strong>{user.organizationName || user.name}</strong>)
            is currently awaiting administrator verification.
          </p>
          <p>
            You will be able to request and collect food as soon as an administrator
            approves your registration.
          </p>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
