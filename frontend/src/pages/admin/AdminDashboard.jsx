import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { adminService } from "../../services/api";
import Alert from "../../components/Alert";

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await adminService.getDashboardStats();
        setStats(res.data || null);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load admin statistics.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="admin-dashboard-page">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1>Administrator Dashboard</h1>
          <p>Monitor platform statistics, verify NGO registrations, and oversee community impact.</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <Link to="/admin/users" className="btn btn-primary">
            Manage Users & NGOs
          </Link>
          <Link to="/admin/reports" className="btn btn-secondary">
            View Reports
          </Link>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError("")} />}

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Calculating platform metrics...</p>
        </div>
      ) : !stats ? (
        <div className="card empty-state">
          <h3>No Data Available</h3>
          <p>Unable to retrieve platform statistics at this time.</p>
        </div>
      ) : (
        <>
          {/* Key KPI Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-card-title">Total Registered Users</span>
              <span className="stat-card-value">{stats.users?.total || 0}</span>
              <span className="stat-card-desc">
                Donors: {stats.users?.byRole?.donor || 0} | NGOs: {stats.users?.byRole?.ngo || 0}
              </span>
            </div>

            <div className="stat-card">
              <span className="stat-card-title">Pending NGO Verifications</span>
              <span
                className="stat-card-value"
                style={{
                  color: (stats.users?.pendingNgos || 0) > 0 ? "var(--warning)" : "var(--primary-dark)"
                }}
              >
                {stats.users?.pendingNgos || 0}
              </span>
              <span className="stat-card-desc">
                <Link to="/admin/users?role=ngo&verificationStatus=pending" style={{ color: "var(--primary-dark)", fontWeight: 600 }}>
                  Review & Verify NGOs →
                </Link>
              </span>
            </div>

            <div className="stat-card">
              <span className="stat-card-title">Total Food Listed</span>
              <span className="stat-card-value" style={{ color: "var(--primary-dark)" }}>
                {stats.listings?.quantity?.totalQuantityListed || 0}
              </span>
              <span className="stat-card-desc">Total meals/items offered</span>
            </div>

            <div className="stat-card">
              <span className="stat-card-title">Meals Distributed</span>
              <span className="stat-card-value" style={{ color: "#7c3aed" }}>
                {stats.impact?.totalMealsDistributed || 0}
              </span>
              <span className="stat-card-desc">Successfully delivered to people</span>
            </div>

            <div className="stat-card">
              <span className="stat-card-title">Beneficiaries Fed</span>
              <span className="stat-card-value" style={{ color: "var(--secondary-dark)" }}>
                {stats.impact?.totalBeneficiariesServed || 0}
              </span>
              <span className="stat-card-desc">Individuals served across communities</span>
            </div>

            <div className="stat-card">
              <span className="stat-card-title">Open Reports</span>
              <span
                className="stat-card-value"
                style={{
                  color: (stats.pendingReports || 0) > 0 ? "var(--danger)" : "var(--text-muted)"
                }}
              >
                {stats.pendingReports || 0}
              </span>
              <span className="stat-card-desc">
                <Link to="/admin/reports" style={{ color: "var(--primary-dark)", fontWeight: 600 }}>
                  Manage Reports →
                </Link>
              </span>
            </div>
          </div>

          {/* Breakdown Grids */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
            {/* Listing Status Breakdown */}
            <div className="card">
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "16px" }}>
                Food Listings Breakdown
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {Object.entries(stats.listings?.byStatus || {}).map(([st, count]) => (
                  <div
                    key={st}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 0",
                      borderBottom: "1px solid var(--border-color)"
                    }}
                  >
                    <span className={`badge badge-${st}`}>{st.replace("_", " ")}</span>
                    <strong style={{ fontSize: "1.05rem" }}>{count} listings</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Request Status Breakdown */}
            <div className="card">
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "16px" }}>
                Food Requests Breakdown
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {Object.entries(stats.requests?.byStatus || {}).map(([st, count]) => (
                  <div
                    key={st}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 0",
                      borderBottom: "1px solid var(--border-color)"
                    }}
                  >
                    <span className={`badge badge-${st}`}>{st.replace("_", " ")}</span>
                    <strong style={{ fontSize: "1.05rem" }}>{count} requests</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
