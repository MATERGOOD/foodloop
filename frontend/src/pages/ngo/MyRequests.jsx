import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { requestService } from "../../services/api";
import Alert from "../../components/Alert";

export const MyRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Distribution modal state
  const [distributingReq, setDistributingReq] = useState(null);
  const [distQuantity, setDistQuantity] = useState("");
  const [distBeneficiaries, setDistBeneficiaries] = useState("");
  const [distNotes, setDistNotes] = useState("");
  const [distSubmitting, setDistSubmitting] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await requestService.getMyRequests();
      setRequests(res.data?.requests || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load your requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleCancel = async (id, foodName) => {
    if (!window.confirm(`Are you sure you want to cancel your request for "${foodName}"?`)) {
      return;
    }

    try {
      setActionLoadingId(id);
      setError("");
      setSuccess("");
      await requestService.cancel(id);
      setSuccess(`Request for "${foodName}" was cancelled.`);
      fetchRequests();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel request.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmCollection = async (id, foodName) => {
    try {
      setActionLoadingId(id);
      setError("");
      setSuccess("");
      await requestService.collect(id);
      setSuccess(`Collection of "${foodName}" confirmed! You can now record distribution.`);
      fetchRequests();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to confirm collection.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const openDistributeModal = (req) => {
    setDistributingReq(req);
    setDistQuantity(req.requestedQuantity);
    setDistBeneficiaries("");
    setDistNotes("");
    setError("");
  };

  const handleDistributeSubmit = async (e) => {
    e.preventDefault();
    if (!distributingReq) return;

    const qty = Number(distQuantity);
    if (isNaN(qty) || qty <= 0) {
      setError("Quantity distributed must be greater than 0.");
      return;
    }

    // Critical rule check
    if (qty > distributingReq.requestedQuantity) {
      setError(
        `Quantity distributed (${qty}) cannot exceed collected quantity (${distributingReq.requestedQuantity}).`
      );
      return;
    }

    const beneficiaries = Number(distBeneficiaries);
    if (isNaN(beneficiaries) || beneficiaries < 0) {
      setError("Beneficiary count must be 0 or more.");
      return;
    }

    try {
      setDistSubmitting(true);
      setError("");
      await requestService.distribute(distributingReq._id, {
        quantityDistributed: qty,
        beneficiaryCount: beneficiaries,
        distributionNotes: distNotes.trim()
      });
      setSuccess("Distribution recorded successfully! Impact metrics updated.");
      setDistributingReq(null);
      fetchRequests();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to record distribution.");
    } finally {
      setDistSubmitting(false);
    }
  };

  const filteredRequests =
    filterStatus === "all"
      ? requests
      : requests.filter((r) => r.status === filterStatus);

  return (
    <div className="my-requests-page">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1>My Food Requests</h1>
          <p>Track request approvals, view pickup instructions upon approval, and record beneficiary distribution.</p>
        </div>
        <Link to="/food" className="btn btn-primary">
          Browse More Food
        </Link>
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
          <p>Loading your requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="card empty-state">
          <h3>No Requests Found</h3>
          <p>You have no {filterStatus !== "all" ? filterStatus : ""} food requests.</p>
          <Link to="/food" className="btn btn-primary" style={{ marginTop: "12px" }}>
            Browse Available Food
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {filteredRequests.map((req) => {
            const food = req.foodListingId || {};
            const donor = food.donorId || {};
            const isApprovedOrBeyond = ["approved", "collected", "distributed"].includes(req.status);
            const isActionLoading = actionLoadingId === req._id;

            return (
              <div
                key={req._id}
                className="card"
                style={{
                  borderLeft:
                    req.status === "approved"
                      ? "4px solid var(--primary)"
                      : req.status === "collected"
                      ? "4px solid var(--secondary)"
                      : req.status === "distributed"
                      ? "4px solid #7c3aed"
                      : "4px solid var(--border-color)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "12px" }}>
                  <div>
                    <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0 }}>
                      {food.foodName || "Surplus Food Item"}
                    </h3>
                    <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", margin: "4px 0 0" }}>
                      Requested: <strong>{req.requestedQuantity} {food.unit || "meals"}</strong> | Category: <span style={{ textTransform: "capitalize" }}>{food.category}</span>
                    </p>
                  </div>
                  <span className={`badge badge-${req.status}`}>
                    {req.status.replace("_", " ")}
                  </span>
                </div>

                {/* Donor and Contact Info - REVEALED ONLY IF APPROVED */}
                {isApprovedOrBeyond ? (
                  <div
                    style={{
                      background: "#ecfdf5",
                      border: "1px solid #a7f3d0",
                      padding: "16px",
                      borderRadius: "var(--radius-sm)",
                      marginBottom: "14px"
                    }}
                  >
                    <h4 style={{ color: "#065f46", fontSize: "0.95rem", fontWeight: 700, marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                      🔓 Pickup & Donor Contact Details (Approved)
                    </h4>
                    <p style={{ margin: "0 0 6px", fontSize: "0.95rem" }}>
                      <strong>Pickup Instructions: </strong>
                      {food.pickupInstructions || "Please coordinate directly with donor."}
                    </p>
                    <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", fontSize: "0.9rem" }}>
                      <div>
                        <span style={{ color: "var(--text-muted)" }}>Donor: </span>
                        <strong>{donor.name}</strong> {donor.organizationName && `(${donor.organizationName})`}
                      </div>
                      {donor.phone && (
                        <div>
                          <span style={{ color: "var(--text-muted)" }}>Phone: </span>
                          <a href={`tel:${donor.phone}`} style={{ color: "var(--primary-dark)", fontWeight: 700 }}>
                            {donor.phone}
                          </a>
                        </div>
                      )}
                      {donor.email && (
                        <div>
                          <span style={{ color: "var(--text-muted)" }}>Email: </span>
                          <a href={`mailto:${donor.email}`}>{donor.email}</a>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      background: "#f8fafc",
                      padding: "12px",
                      borderRadius: "var(--radius-sm)",
                      marginBottom: "14px",
                      fontSize: "0.85rem",
                      color: "var(--text-muted)"
                    }}
                  >
                    🔒 <strong>Contact Hidden:</strong> Donor contact information and exact pickup instructions will be revealed once the donor approves this request.
                  </div>
                )}

                {/* Status Message or Notes */}
                {req.message && (
                  <p style={{ fontSize: "0.85rem", color: "#334155", fontStyle: "italic", marginBottom: "12px" }}>
                    Your message: "{req.message}"
                  </p>
                )}

                {/* Footer and Actions */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", borderTop: "1px solid var(--border-color)", paddingTop: "12px" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    Requested: {new Date(req.createdAt).toLocaleString()}
                  </span>

                  <div style={{ display: "flex", gap: "8px" }}>
                    {/* Approved actions */}
                    {req.status === "approved" && (
                      <>
                        <button
                          onClick={() => handleConfirmCollection(req._id, food.foodName)}
                          className="btn btn-primary btn-sm"
                          disabled={isActionLoading}
                        >
                          {isActionLoading ? "Processing..." : "📦 Confirm Collection"}
                        </button>
                        <button
                          onClick={() => handleCancel(req._id, food.foodName)}
                          className="btn btn-secondary btn-sm"
                          disabled={isActionLoading}
                        >
                          Cancel Request
                        </button>
                      </>
                    )}

                    {/* Pending actions */}
                    {req.status === "pending" && (
                      <button
                        onClick={() => handleCancel(req._id, food.foodName)}
                        className="btn btn-secondary btn-sm"
                        disabled={isActionLoading}
                      >
                        Cancel Request
                      </button>
                    )}

                    {/* Collected actions */}
                    {req.status === "collected" && (
                      <button
                        onClick={() => openDistributeModal(req)}
                        className="btn btn-success btn-sm"
                      >
                        🎉 Record Distribution
                      </button>
                    )}

                    {/* Distributed confirmation */}
                    {req.status === "distributed" && (
                      <span style={{ fontSize: "0.85rem", color: "#5b21b6", fontWeight: 600 }}>
                        ✓ Food Distributed & Logged in Platform Impact!
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Distribution Modal */}
      {distributingReq && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3>Record Food Distribution</h3>
              <button
                className="alert-close-btn"
                onClick={() => setDistributingReq(null)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleDistributeSubmit}>
              <div className="modal-body">
                <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "16px" }}>
                  Log how many meals from <strong>{distributingReq.foodListingId?.foodName}</strong> were distributed to beneficiaries.
                </p>

                <div className="form-group">
                  <label htmlFor="distQuantity">
                    Quantity Distributed ({distributingReq.foodListingId?.unit || "units"})
                  </label>
                  <input
                    id="distQuantity"
                    type="number"
                    min="1"
                    max={distributingReq.requestedQuantity}
                    step="any"
                    className="form-control"
                    value={distQuantity}
                    onChange={(e) => setDistQuantity(e.target.value)}
                    required
                  />
                  <span className="form-hint">
                    Cannot exceed collected quantity (<strong>{distributingReq.requestedQuantity}</strong>).
                  </span>
                </div>

                <div className="form-group">
                  <label htmlFor="distBeneficiaries">Beneficiary Count (People Fed)</label>
                  <input
                    id="distBeneficiaries"
                    type="number"
                    min="0"
                    step="1"
                    className="form-control"
                    value={distBeneficiaries}
                    onChange={(e) => setDistBeneficiaries(e.target.value)}
                    placeholder="e.g. 45"
                    required
                  />
                  <span className="form-hint">
                    Approximate number of individuals who received meals.
                  </span>
                </div>

                <div className="form-group">
                  <label htmlFor="distNotes">Distribution Notes & Location</label>
                  <textarea
                    id="distNotes"
                    className="form-control"
                    value={distNotes}
                    onChange={(e) => setDistNotes(e.target.value)}
                    placeholder="e.g. Distributed to families at Central Community Shelter."
                    rows={2}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setDistributingReq(null)}
                  disabled={distSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={distSubmitting}
                >
                  {distSubmitting ? "Recording..." : "Save Distribution"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyRequests;
