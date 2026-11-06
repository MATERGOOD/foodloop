import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { foodService, SERVER_BASE_URL } from "../../services/api";
import Alert from "../../components/Alert";

export const MyDonations = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Edit modal state
  const [editingListing, setEditingListing] = useState(null);
  const [editQuantity, setEditQuantity] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [editInstructions, setEditInstructions] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const res = await foodService.getMine();
      setListings(res.data?.listings || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load donations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleCancelListing = async (id, foodName) => {
    if (!window.confirm(`Are you sure you want to cancel the listing "${foodName}"?`)) {
      return;
    }

    try {
      setError("");
      setSuccess("");
      await foodService.cancel(id);
      setSuccess(`Listing "${foodName}" was cancelled.`);
      fetchListings();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel listing.");
    }
  };

  const openEditModal = (listing) => {
    setEditingListing(listing);
    setEditQuantity(listing.quantity);
    // Format to datetime-local
    const pad = (n) => String(n).padStart(2, "0");
    const d = new Date(listing.safePickupDeadline);
    const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
    setEditDeadline(formatted);
    setEditInstructions(listing.pickupInstructions || "");
  };

  const handleUpdateListing = async (e) => {
    e.preventDefault();
    if (!editingListing) return;

    const newQty = Number(editQuantity);
    if (newQty < (editingListing.reservedQuantity || 0)) {
      setError(
        `Cannot reduce quantity (${newQty}) below already reserved quantity (${editingListing.reservedQuantity}).`
      );
      return;
    }

    try {
      setEditSubmitting(true);
      setError("");
      await foodService.update(editingListing._id, {
        quantity: newQty,
        safePickupDeadline: new Date(editDeadline).toISOString(),
        pickupInstructions: editInstructions.trim()
      });
      setSuccess("Listing updated successfully.");
      setEditingListing(null);
      fetchListings();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update listing.");
    } finally {
      setEditSubmitting(false);
    }
  };

  return (
    <div className="my-donations-page">
      <div
        className="page-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px"
        }}
      >
        <div>
          <h1>My Food Donations</h1>
          <p>Track your surplus food listings and update pickup details</p>
        </div>
        <Link to="/donor/add" className="btn btn-primary">
          + Add New Listing
        </Link>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError("")} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess("")} />}

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading your donations...</p>
        </div>
      ) : listings.length === 0 ? (
        <div className="card empty-state">
          <h3>No Food Listings Found</h3>
          <p>You haven't listed any surplus food yet.</p>
          <Link to="/donor/add" className="btn btn-primary" style={{ marginTop: "12px" }}>
            Create Your First Listing
          </Link>
        </div>
      ) : (
        <div className="food-grid">
          {listings.map((listing) => (
            <div key={listing._id} className="food-card">
              {listing.image ? (
                <img
                  src={
                    listing.image.startsWith("http")
                      ? listing.image
                      : `${SERVER_BASE_URL}${listing.image}`
                  }
                  alt={listing.foodName}
                  className="food-card-img"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              ) : (
                <div
                  className="food-card-img"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "3rem"
                  }}
                >
                  🍲
                </div>
              )}

              <div className="food-card-body">
                <div className="food-card-header">
                  <div>
                    <h3 className="food-card-title">{listing.foodName}</h3>
                    <span className="food-card-category">{listing.category}</span>
                  </div>
                  <span className={`badge badge-${listing.status}`}>
                    {listing.status.replace("_", " ")}
                  </span>
                </div>

                {listing.description && (
                  <p className="food-card-desc">{listing.description}</p>
                )}

                <div className="food-meta">
                  <div className="food-meta-item">
                    <span>Total Quantity:</span>
                    <strong>
                      {listing.quantity} {listing.unit}
                    </strong>
                  </div>
                  <div className="food-meta-item">
                    <span>Available Remaining:</span>
                    <strong style={{ color: "var(--primary-dark)" }}>
                      {listing.availableQuantity} {listing.unit}
                    </strong>
                  </div>
                  <div className="food-meta-item">
                    <span>Reserved:</span>
                    <span>
                      {listing.reservedQuantity || 0} {listing.unit}
                    </span>
                  </div>
                  <div className="food-meta-item">
                    <span>Handed Over:</span>
                    <span>
                      {listing.collectedQuantity || 0} {listing.unit}
                    </span>
                  </div>
                  <div className="food-meta-item">
                    <span>Pickup Deadline:</span>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      {new Date(listing.safePickupDeadline).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    marginTop: "16px",
                    borderTop: "1px solid var(--border-color)",
                    paddingTop: "12px"
                  }}
                >
                  {!["completed", "cancelled", "expired"].includes(listing.status) ? (
                    <>
                      <button
                        onClick={() => openEditModal(listing)}
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1 }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleCancelListing(listing._id, listing.foodName)}
                        className="btn btn-danger btn-sm"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <span
                      style={{
                        fontSize: "0.85rem",
                        color: "var(--text-muted)",
                        fontStyle: "italic",
                        textAlign: "center",
                        width: "100%"
                      }}
                    >
                      Listing is {listing.status}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingListing && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3>Edit Listing: {editingListing.foodName}</h3>
              <button
                className="alert-close-btn"
                onClick={() => setEditingListing(null)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleUpdateListing}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="editQuantity">
                    Total Quantity ({editingListing.unit})
                  </label>
                  <input
                    id="editQuantity"
                    type="number"
                    min={editingListing.reservedQuantity || 0.1}
                    step="any"
                    className="form-control"
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(e.target.value)}
                    required
                  />
                  <p className="form-hint">
                    Cannot reduce below already reserved quantity (
                    <strong>{editingListing.reservedQuantity || 0}</strong>).
                  </p>
                </div>

                <div className="form-group">
                  <label htmlFor="editDeadline">Safe Pickup Deadline</label>
                  <input
                    id="editDeadline"
                    type="datetime-local"
                    className="form-control"
                    value={editDeadline}
                    onChange={(e) => setEditDeadline(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="editInstructions">Pickup Instructions</label>
                  <textarea
                    id="editInstructions"
                    className="form-control"
                    value={editInstructions}
                    onChange={(e) => setEditInstructions(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingListing(null)}
                  disabled={editSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={editSubmitting}
                >
                  {editSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyDonations;
