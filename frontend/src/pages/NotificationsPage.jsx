import React, { useState, useEffect } from "react";
import { notificationService } from "../services/api";
import Alert from "../components/Alert";

export const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationService.getAll();
      setNotifications(res.data?.notifications || []);
      setUnreadCount(res.data?.unreadCount || 0);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markRead(id);
      fetchNotifications();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to mark notification as read.");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllRead();
      setSuccess("All notifications marked as read.");
      fetchNotifications();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to mark all as read.");
    }
  };

  return (
    <div style={{ maxWidth: "780px", margin: "20px auto" }}>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1>Notifications</h1>
          <p>Stay updated on requests, approvals, handovers, and account verifications.</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllAsRead} className="btn btn-secondary btn-sm">
            ✓ Mark All as Read ({unreadCount})
          </button>
        )}
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError("")} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess("")} />}

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="card empty-state">
          <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>🔔</div>
          <h3>No Notifications</h3>
          <p>You have no notifications at this time.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {notifications.map((n) => (
            <div
              key={n._id}
              className="card"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "16px",
                background: n.isRead ? "var(--bg-card)" : "#f0fdf4",
                borderLeft: n.isRead ? "1px solid var(--border-color)" : "4px solid var(--primary)"
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <h4 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0, color: n.isRead ? "var(--text-main)" : "#065f46" }}>
                    {n.title}
                  </h4>
                  {!n.isRead && (
                    <span className="badge badge-available" style={{ fontSize: "0.7rem" }}>
                      New
                    </span>
                  )}
                </div>
                <p style={{ margin: "4px 0", color: "#334155", fontSize: "0.95rem" }}>{n.message}</p>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  {new Date(n.createdAt).toLocaleString()}
                </span>
              </div>

              {!n.isRead && (
                <button
                  onClick={() => handleMarkAsRead(n._id)}
                  className="btn btn-secondary btn-sm"
                  title="Mark as read"
                >
                  ✓ Read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
