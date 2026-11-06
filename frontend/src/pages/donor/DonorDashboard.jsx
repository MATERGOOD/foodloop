import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { foodService, requestService } from "../../services/api";
import Alert from "../../components/Alert";

export const DonorDashboard = () => {
  const [listings, setListings] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [listingsRes, requestsRes] = await Promise.all([
          foodService.getMine(),
          requestService.getReceivedRequests()
        ]);
        setListings(listingsRes.data?.listings || []);
        setRequests(requestsRes.data?.requests || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const pendingRequestsCount = requests.filter((r) => r.status === "pending").length;
  const activeListingsCount = listings.filter((l) =>
    ["available", "partially_reserved"].includes(l.status)
  ).length;
  const totalMealsDonated = listings.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
  const totalMealsCollected = listings.reduce((acc, curr) => acc + (curr.collectedQuantity || 0), 0);

  return (
    <div className="donor-dashboard">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1>Donor Dashboard</h1>
          <p>Manage your food donations and coordinate pickups with NGOs</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <Link to="/donor/add" className="btn btn-primary">
            + New Donation
          </Link>
          <Link to="/donor/requests" className="btn btn-secondary">
            Requests {pendingRequestsCount > 0 && `(${pendingRequestsCount})`}
          </Link>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError("")} />}

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-card-title">Active Listings</span>
          <span className="stat-card-value" style={{ color: "var(--primary-dark)" }}>
            {activeListingsCount}
          </span>
          <span className="stat-card-desc">Currently open for NGO requests</span>
        </div>

        <div className="stat-card">
          <span className="stat-card-title">Pending Requests</span>
          <span className="stat-card-value" style={{ color: pendingRequestsCount > 0 ? "var(--warning)" : "var(--text-muted)" }}>
            {pendingRequestsCount}
          </span>
          <span className="stat-card-desc">Awaiting your approval/decision</span>
        </div>

        <div className="stat-card">
          <span className="stat-card-title">Total Food Listed</span>
          <span className="stat-card-value">{totalMealsDonated}</span>
          <span className="stat-card-desc">Meals / items committed</span>
        </div>

        <div className="stat-card">
          <span className="stat-card-title">Total Handed Over</span>
          <span className="stat-card-value" style={{ color: "var(--secondary-dark)" }}>
            {totalMealsCollected}
          </span>
          <span className="stat-card-desc">Collected by verified NGOs</span>
        </div>
      </div>

      {/* Recent Listings */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 700 }}>Your Active Food Listings</h3>
          <Link to="/donor/donations" style={{ color: "var(--primary-dark)", fontSize: "0.9rem", fontWeight: 600 }}>
            View All ({listings.length}) →
          </Link>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading listings...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="empty-state">
            <p>You haven't listed any surplus food yet.</p>
            <Link to="/donor/add" className="btn btn-primary" style={{ marginTop: "12px" }}>
              Create Your First Donation
            </Link>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Food Item</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Available</th>
                  <th>Status</th>
                  <th>Safe Deadline</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {listings.slice(0, 5).map((listing) => (
                  <tr key={listing._id}>
                    <td>
                      <strong>{listing.foodName}</strong>
                    </td>
                    <td style={{ textTransform: "capitalize" }}>{listing.category}</td>
                    <td>
                      {listing.quantity} {listing.unit}
                    </td>
                    <td>
                      <strong style={{ color: "var(--primary-dark)" }}>
                        {listing.availableQuantity} {listing.unit}
                      </strong>
                    </td>
                    <td>
                      <span className={`badge badge-${listing.status}`}>
                        {listing.status.replace("_", " ")}
                      </span>
                    </td>
                    <td>{new Date(listing.safePickupDeadline).toLocaleString()}</td>
                    <td>
                      <Link to="/donor/donations" className="btn btn-secondary btn-sm">
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pending Requests Banner */}
      {pendingRequestsCount > 0 && (
        <div className="alert-card alert-warning" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", borderRadius: "var(--radius-md)", border: "1px solid #fde68a", background: "#fef3c7" }}>
          <div>
            <strong>You have {pendingRequestsCount} pending food request(s)!</strong>
            <p style={{ fontSize: "0.85rem", color: "#92400e", margin: 0 }}>
              NGOs are waiting for your approval to collect surplus meals.
            </p>
          </div>
          <Link to="/donor/requests" className="btn btn-warning btn-sm">
            Review Requests →
          </Link>
        </div>
      )}
    </div>
  );
};

export default DonorDashboard;
