import React, { useState, useEffect } from "react";
import { requestService } from "../../services/api";
import Alert from "../../components/Alert";

export const ReceivedRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await requestService.getReceivedRequests();
      setRequests(res.data?.requests || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load received requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id, foodName) => {
    try {
      setActionLoadingId(id);
      setError("");
      setSuccess("");
      await requestService.approve(id);
      setSuccess(`Request for "${foodName}" approved! Reserved quantity updated.`);
      fetchRequests();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to approve request.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id, foodName) => {
    if (!window.confirm(`Are you sure you want to decline this request for "${foodName}"?`)) {
      return;
    }

    try {
      setActionLoadingId(id);
      setError("");
      setSuccess("");
      await requestService.reject(id);
      setSuccess(`Request for "${foodName}" declined.`);
      fetchRequests();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reject request.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmHandover = async (id, foodName) => {
    try {
      setActionLoadingId(id);
      setError("");
      setSuccess("");
      await requestService.collect(id);
      setSuccess(`Food handover for "${foodName}" confirmed! Status updated to Collected.`);
      fetchRequests();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to confirm handover.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredRequests =
    filterStatus === "all"
      ? requests
      : requests.filter((r) => r.status === filterStatus);

  return (
    <div className="received-requests-page">
      <div className="page-header">
        <h1>Received Food Requests</h1>
        <p>Review requests from verified NGOs and volunteers, approve reservations, and confirm food handovers.</p>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError("")} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess("")} />}

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
        {["all", "pending", "approved", "collected", "distributed", "rejected", "cancelled"].map(
          (status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`btn btn-sm ${filterStatus === status ? "btn-primary" : "btn-secondary"}`}
              style={{ textTransform: "capitalize" }}
            >
              {status} ({status === "all" ? requests.length : requests.filter((r) => r.status === status).length})
            </button>
          )
        )}
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="card empty-state">
          <h3>No Requests Found</h3>
          <p>There are no {filterStatus !== "all" ? filterStatus : ""} requests on your listings at this time.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {filteredRequests.map((req) => {
            const food = req.foodListingId || {};
            const requester = req.requesterId || {};
            const isActionLoading = actionLoadingId === req._id;

            return (
              <div key={req._id} className="card" style={{ borderLeft: req.status === "pending" ? "4px solid var(--warning)" : "4px solid var(--primary)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "12px" }}>
                  <div>
                    <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0 }}>
                      {food.foodName || "Food Item"}
                    </h3>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                      Requested: <strong>{req.requestedQuantity} {food.unit || "units"}</strong> (Total Listing: {food.quantity} {food.unit})
                    </p>
                  </div>
                  <span className={`badge badge-${req.status}`}>
                    {req.status.replace("_", " ")}
                  </span>
                </div>

                {/* Requester Info */}
                <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "var(--radius-sm)", marginBottom: "14px", fontSize: "0.9rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "8px" }}>
                    <div>
                      <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Requester: </span>
                      <strong>{requester.name}</strong> ({requester.role})
                    </div>
                    {requester.organizationName && (
                      <div>
                        <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Organization: </span>
                        <strong>{requester.organizationName}</strong>
                      </div>
                    )}
                    <div>
                      <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Phone: </span>
                      <a href={`tel:${requester.phone}`} style={{ color: "var(--primary-dark)" }}>
                        {requester.phone || "Not provided"}
                      </a>
                    </div>
                  </div>

                  {req.message && (
                    <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid var(--border-color)" }}>
                      <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Message from requester: </span>
                      <p style={{ margin: "2px 0 0", fontStyle: "italic", color: "#334155" }}>"{req.message}"</p>
                    </div>
                  )}
                </div>

                {/* Timestamps & Action Buttons */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    Submitted on: {new Date(req.createdAt).toLocaleString()}
                  </span>

                  <div style={{ display: "flex", gap: "8px" }}>
                    {req.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleApprove(req._id, food.foodName)}
                          className="btn btn-primary btn-sm"
                          disabled={isActionLoading}
                        >
                          {isActionLoading ? "Processing..." : "✓ Approve Request"}
                        </button>
                        <button
                          onClick={() => handleReject(req._id, food.foodName)}
                          className="btn btn-danger btn-sm"
                          disabled={isActionLoading}
                        >
                          {isActionLoading ? "Processing..." : "✕ Decline"}
                        </button>
                      </>
                    )}

                    {req.status === "approved" && (
                      <button
                        onClick={() => handleConfirmHandover(req._id, food.foodName)}
                        className="btn btn-success btn-sm"
                        disabled={isActionLoading}
                      >
                        {isActionLoading ? "Processing..." : "🤝 Confirm Handover"}
                      </button>
                    )}

                    {req.status === "collected" && (
                      <span style={{ fontSize: "0.85rem", color: "var(--secondary-dark)", fontWeight: 600 }}>
                        ✓ Handover complete. Awaiting distribution by requester.
                      </span>
                    )}

                    {req.status === "distributed" && (
                      <span style={{ fontSize: "0.85rem", color: "#5b21b6", fontWeight: 600 }}>
                        ✓ Food has been distributed to beneficiaries!
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ReceivedRequests;
