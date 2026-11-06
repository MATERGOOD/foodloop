import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { adminService } from "../../services/api";
import Alert from "../../components/Alert";

export const UserManagement = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRole = searchParams.get("role") || "";
  const initialStatus = searchParams.get("verificationStatus") || "";

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [roleFilter, setRoleFilter] = useState(initialRole);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.verificationStatus = statusFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const res = await adminService.getUsers(params);
      setUsers(res.data?.users || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const handleVerify = async (userId, userName, status) => {
    try {
      setActionLoadingId(userId);
      setError("");
      setSuccess("");
      await adminService.verifyUser(userId, status);
      setSuccess(`Organization "${userName}" verification status updated to '${status}'.`);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update user verification.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  return (
    <div className="user-management-page">
      <div className="page-header">
        <h1>User Management & NGO Verification</h1>
        <p>Review registered accounts, monitor platform participants, and verify or reject NGO credentials.</p>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError("")} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess("")} />}

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: "20px", padding: "16px" }}>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: "200px" }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search by name, email, or organization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ minWidth: "150px" }}>
            <select
              className="form-control"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="ngo">NGOs</option>
              <option value="donor">Donors</option>
              <option value="volunteer">Volunteers</option>
              <option value="admin">Admins</option>
            </select>
          </div>

          <div style={{ minWidth: "160px" }}>
            <select
              className="form-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Verifications</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary">
            Search
          </button>
          {(searchTerm || roleFilter || statusFilter) && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setSearchTerm("");
                setRoleFilter("");
                setStatusFilter("");
              }}
            >
              Reset
            </button>
          )}
        </form>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading users...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="card empty-state">
          <h3>No Users Found</h3>
          <p>No user accounts matched your current filter criteria.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>User / Organization</th>
                <th>Role</th>
                <th>Contact</th>
                <th>Verification</th>
                <th>Joined</th>
                <th>Verification Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isActionLoading = actionLoadingId === u._id;

                return (
                  <tr key={u._id}>
                    <td>
                      <strong>{u.name}</strong>
                      {u.organizationName && (
                        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                          Org: {u.organizationName}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="badge" style={{ backgroundColor: "#f1f5f9", color: "#334155" }}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <div>{u.email}</div>
                      {u.phone && (
                        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                          {u.phone}
                        </div>
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge badge-${u.verificationStatus}`}
                        style={{
                          backgroundColor:
                            u.verificationStatus === "verified"
                              ? "#d1fae5"
                              : u.verificationStatus === "rejected"
                              ? "#fee2e2"
                              : "#fef3c7",
                          color:
                            u.verificationStatus === "verified"
                              ? "#065f46"
                              : u.verificationStatus === "rejected"
                              ? "#991b1b"
                              : "#92400e"
                        }}
                      >
                        {u.verificationStatus || "verified"}
                      </span>
                    </td>
                    <td style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      {u.role === "ngo" ? (
                        <div style={{ display: "flex", gap: "6px" }}>
                          {u.verificationStatus !== "verified" && (
                            <button
                              onClick={() => handleVerify(u._id, u.organizationName || u.name, "verified")}
                              className="btn btn-success btn-sm"
                              disabled={isActionLoading}
                            >
                              {isActionLoading ? "..." : "✓ Verify"}
                            </button>
                          )}

                          {u.verificationStatus !== "rejected" && (
                            <button
                              onClick={() => handleVerify(u._id, u.organizationName || u.name, "rejected")}
                              className="btn btn-danger btn-sm"
                              disabled={isActionLoading}
                            >
                              {isActionLoading ? "..." : "✕ Reject"}
                            </button>
                          )}

                          {u.verificationStatus === "verified" && (
                            <span style={{ fontSize: "0.85rem", color: "var(--primary-dark)", fontWeight: 600 }}>
                              Verified NGO
                            </span>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                          Not required
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
