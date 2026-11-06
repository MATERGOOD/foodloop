import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { notificationService } from "../services/api";

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchUnread = async () => {
      if (isAuthenticated) {
        try {
          const res = await notificationService.getAll();
          if (isMounted && res.data) {
            setUnreadCount(res.data.unreadCount || 0);
          }
        } catch (err) {
          // Silent fail for polling
        }
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); // 30 sec poll

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isAuthenticated, location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Brand */}
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">🍲</span>
          <span className="brand-name">FoodLoop</span>
        </Link>

        {/* Mobile Toggle Button */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation menu"
        >
          {menuOpen ? "✕" : "☰"}
        </button>

        {/* Navigation Links */}
        <div className={`nav-links ${menuOpen ? "open" : ""}`}>
          <Link
            to="/"
            className={`nav-link ${isActive("/") ? "active" : ""}`}
            onClick={() => setMenuOpen(false)}
          >
            Home
          </Link>

          {/* Public or NGO/Volunteer/Admin browse link */}
          {(!isAuthenticated || user?.role !== "donor") && (
            <Link
              to="/food"
              className={`nav-link ${isActive("/food") ? "active" : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              Browse Food
            </Link>
          )}

          {/* DONOR LINKS */}
          {isAuthenticated && user?.role === "donor" && (
            <>
              <Link
                to="/donor/dashboard"
                className={`nav-link ${isActive("/donor/dashboard") ? "active" : ""}`}
                onClick={() => setMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                to="/donor/add"
                className={`nav-link ${isActive("/donor/add") ? "active" : ""}`}
                onClick={() => setMenuOpen(false)}
              >
                + Donate Food
              </Link>
              <Link
                to="/donor/donations"
                className={`nav-link ${isActive("/donor/donations") ? "active" : ""}`}
                onClick={() => setMenuOpen(false)}
              >
                My Listings
              </Link>
              <Link
                to="/donor/requests"
                className={`nav-link ${isActive("/donor/requests") ? "active" : ""}`}
                onClick={() => setMenuOpen(false)}
              >
                Received Requests
              </Link>
            </>
          )}

          {/* NGO / VOLUNTEER LINKS */}
          {isAuthenticated && (user?.role === "ngo" || user?.role === "volunteer") && (
            <>
              <Link
                to="/requests/my"
                className={`nav-link ${isActive("/requests/my") ? "active" : ""}`}
                onClick={() => setMenuOpen(false)}
              >
                My Requests
              </Link>
            </>
          )}

          {/* ADMIN LINKS */}
          {isAuthenticated && user?.role === "admin" && (
            <>
              <Link
                to="/admin/dashboard"
                className={`nav-link ${isActive("/admin/dashboard") ? "active" : ""}`}
                onClick={() => setMenuOpen(false)}
              >
                Admin Stats
              </Link>
              <Link
                to="/admin/users"
                className={`nav-link ${isActive("/admin/users") ? "active" : ""}`}
                onClick={() => setMenuOpen(false)}
              >
                Users & Verification
              </Link>
              <Link
                to="/admin/reports"
                className={`nav-link ${isActive("/admin/reports") ? "active" : ""}`}
                onClick={() => setMenuOpen(false)}
              >
                Reports
              </Link>
            </>
          )}

          {/* NOTIFICATIONS & AUTH ACTIONS */}
          {isAuthenticated ? (
            <div className="nav-user-section">
              <Link
                to="/notifications"
                className={`nav-link nav-notification-link ${
                  isActive("/notifications") ? "active" : ""
                }`}
                onClick={() => setMenuOpen(false)}
              >
                🔔 Notifications
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount}</span>
                )}
              </Link>

              <span className="user-badge role-badge">
                {user.name} ({user.role})
                {user.role === "ngo" && user.verificationStatus === "pending" && (
                  <span className="badge-pending" title="Account Pending Admin Verification">
                    ⏳ Pending
                  </span>
                )}
              </span>

              <button onClick={handleLogout} className="btn-logout">
                Logout
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link
                to="/login"
                className="btn btn-secondary btn-sm"
                onClick={() => setMenuOpen(false)}
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="btn btn-primary btn-sm"
                onClick={() => setMenuOpen(false)}
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
