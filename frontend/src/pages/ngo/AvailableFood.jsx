import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { foodService, SERVER_BASE_URL } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import Alert from "../../components/Alert";

export const AvailableFood = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const fetchListings = async () => {
    try {
      setLoading(true);
      const params = {};
      if (categoryFilter) params.category = categoryFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const res = await foodService.getAvailable(params);
      setListings(res.data?.listings || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load available food listings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [categoryFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchListings();
  };

  return (
    <div className="available-food-page">
      <div className="page-header">
        <h1>Available Surplus Food</h1>
        <p>Browse fresh surplus food listed by local donors. Food is sorted by urgency (nearest safe pickup deadline first).</p>
      </div>

      {user?.role === "ngo" && user?.verificationStatus === "pending" && (
        <div className="alert-card alert-warning" style={{ padding: "14px 18px", borderRadius: "var(--radius-sm)", marginBottom: "20px", background: "#fef3c7", border: "1px solid #fde68a" }}>
          <strong>⚠️ Account Verification Pending:</strong> You can browse available listings, but submitting requests requires administrator verification.
        </div>
      )}

      {error && <Alert type="error" message={error} onClose={() => setError("")} />}

      {/* Search & Filters */}
      <div className="card" style={{ marginBottom: "24px", padding: "16px" }}>
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: "220px" }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search by food name (e.g. Rice, Bread)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ minWidth: "180px" }}>
            <select
              className="form-control"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="cooked">Cooked Meals</option>
              <option value="packaged">Packaged / Dry</option>
              <option value="fruits">Fruits & Veggies</option>
              <option value="bakery">Bakery</option>
              <option value="other">Other</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary">
            Search
          </button>
          {(searchTerm || categoryFilter) && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setSearchTerm("");
                setCategoryFilter("");
              }}
            >
              Reset
            </button>
          )}
        </form>
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Fetching active food listings...</p>
        </div>
      ) : listings.length === 0 ? (
        <div className="card empty-state">
          <h3>No Available Food Listings</h3>
          <p>There are no active food donations matching your search at this moment. Please check back soon!</p>
        </div>
      ) : (
        <div className="food-grid">
          {listings.map((listing) => {
            const donor = listing.donorId || {};
            const timeLeft = Math.max(
              0,
              Math.round((new Date(listing.safePickupDeadline) - new Date()) / (1000 * 60))
            );
            const hoursLeft = Math.floor(timeLeft / 60);
            const minsLeft = timeLeft % 60;

            return (
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
                      <span>Available Quantity:</span>
                      <strong style={{ color: "var(--primary-dark)", fontSize: "1.05rem" }}>
                        {listing.availableQuantity} {listing.unit}
                      </strong>
                    </div>

                    <div className="food-meta-item">
                      <span>Donor:</span>
                      <strong>{donor.organizationName || donor.name}</strong>
                    </div>

                    <div className="food-meta-item">
                      <span>Pickup Deadline:</span>
                      <strong style={{ color: hoursLeft < 3 ? "var(--danger)" : "var(--text-main)" }}>
                        {hoursLeft > 0 ? `${hoursLeft}h ` : ""}
                        {minsLeft}m left
                      </strong>
                    </div>
                  </div>

                  <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid var(--border-color)" }}>
                    <Link
                      to={`/food/${listing._id}`}
                      className="btn btn-primary"
                      style={{ width: "100%" }}
                    >
                      View Details & Request →
                    </Link>
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

export default AvailableFood;
