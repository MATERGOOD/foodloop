import React, { useState, useEffect } from "react";
import { adminService } from "../../services/api";
import Alert from "../../components/Alert";

export const ReportManagement = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal update state
  const [selectedReport, setSelectedReport] = useState(null);
  const [newStatus, setNewStatus] = useState("reviewed");
  const [adminRemarks, setAdminRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await adminService.getReports();
      setReports(res.data?.reports || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const openModal = (report) => {
    setSelectedReport(report);
    setNewStatus(report.status === "pending" ? "reviewed" : report.status);
    setAdminRemarks(report.adminRemarks || "");
  };

  const handleUpdateReport = async (e) => {
    e.preventDefault();
    if (!selectedReport) return;

    try {
      setSubmitting(true);
      setError("");
      await adminService.updateReport(selectedReport._id, {
        status: newStatus,
        adminRemarks
      });
      setSuccess("Report status and remarks updated successfully.");
      setSelectedReport(null);
      fetchReports();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update report.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredReports =
    statusFilter === "all"
      ? reports
      : reports.filter((r) => r.status === statusFilter);

  return (
    <div className="report-management-page">
      <div className="page-header">
        <h1>Moderation Reports & Inquiries</h1>
        <p>Review community feedback, report submissions, and dispute resolutions.</p>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError("")} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess("")} />}

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
        {["all", "pending", "reviewed", "resolved", "dismissed"].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`btn btn-sm ${statusFilter === status ? "btn-primary" : "btn-secondary"}`}
            style={{ textTransform: "capitalize" }}
          >
            {status} ({status === "all" ? reports.length : reports.filter((r) => r.status === status).length})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading reports...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="card empty-state">
          <h3>No Reports Found</h3>
          <p>There are no {statusFilter !== "all" ? statusFilter : ""} reports at this time.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {filteredReports.map((report) => (
            <div key={report._id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0 }}>
                    {report.reason}
                  </h3>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    Reported by: <strong>{report.reportedBy?.name || "User"}</strong> ({report.reportedBy?.email})
                  </span>
                </div>
                <span
                  className="badge"
                  style={{
                    backgroundColor:
                      report.status === "pending"
                        ? "var(--warning-light)"
                        : report.status === "resolved"
                        ? "var(--primary-light)"
                        : "#f1f5f9",
                    color:
                      report.status === "pending"
                        ? "var(--warning-text)"
                        : report.status === "resolved"
                        ? "var(--primary-text)"
                        : "#334155"
                  }}
                >
                  {report.status}
                </span>
              </div>

              {report.description && (
                <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "var(--radius-sm)", marginBottom: "12px", fontSize: "0.9rem" }}>
                  <p style={{ margin: 0, color: "#334155" }}>{report.description}</p>
                </div>
              )}

              {report.foodListingId && (
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "6px" }}>
                  Related Listing: <strong>{report.foodListingId.foodName}</strong>
                </p>
              )}

              {report.reportedUserId && (
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "6px" }}>
                  Reported User: <strong>{report.reportedUserId.name}</strong> ({report.reportedUserId.role})
                </p>
              )}

              {report.adminRemarks && (
                <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "10px 14px", borderRadius: "var(--radius-sm)", marginTop: "10px", fontSize: "0.85rem" }}>
                  <strong>Admin Remarks:</strong> {report.adminRemarks}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "14px", paddingTop: "12px", borderTop: "1px solid var(--border-color)" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  Submitted: {new Date(report.createdAt).toLocaleString()}
                </span>
                <button onClick={() => openModal(report)} className="btn btn-secondary btn-sm">
                  Review & Action →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedReport && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3>Action on Report</h3>
              <button className="alert-close-btn" onClick={() => setSelectedReport(null)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleUpdateReport}>
              <div className="modal-body">
                <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "16px" }}>
                  Reason: <strong>{selectedReport.reason}</strong>
                </p>

                <div className="form-group">
                  <label htmlFor="newStatus">Update Status</label>
                  <select
                    id="newStatus"
                    className="form-control"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    required
                  >
                    <option value="pending">Pending</option>
                    <option value="reviewed">Under Review</option>
                    <option value="resolved">Resolved</option>
                    <option value="dismissed">Dismissed</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="adminRemarks">Admin Remarks</label>
                  <textarea
                    id="adminRemarks"
                    className="form-control"
                    value={adminRemarks}
                    onChange={(e) => setAdminRemarks(e.target.value)}
                    placeholder="Enter resolution notes, outcome, or actions taken..."
                    rows={3}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedReport(null)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Saving..." : "Save Action"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportManagement;
