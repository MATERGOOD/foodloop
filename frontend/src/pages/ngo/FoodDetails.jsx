import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { foodService, requestService, SERVER_BASE_URL } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import Alert from "../../components/Alert";

export const FoodDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Request form state
  const [requestedQuantity, setRequestedQuantity] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);
        const res = await foodService.getById(id);
        setListing(res.data?.listing || null);
        if (res.data?.listing) {
          setRequestedQuantity(res.data.listing.availableQuantity || 1);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load food listing details.");
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id]);

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/food/${id}` } });
      return;
    }

    if (user?.role === "donor") {
      setError("Donors cannot submit food requests. Please switch to an NGO or Volunteer account.");
      return;
    }

    if (user?.role === "ngo" && user?.verificationStatus !== "verified") {
      setError("Your NGO account is pending admin verification. You cannot submit requests yet.");
      return;
    }

    const qty = Number(requestedQuantity);
    if (isNaN(qty) || qty <= 0) {
      setError("Requested quantity must be greater than 0.");
      return;
    }

    if (listing && qty > listing.availableQuantity) {
      setError(`Cannot request ${qty}. Only ${listing.availableQuantity} ${listing.unit} available.`);
      return;
    }

    try {
      setSubmitting(true);
      await requestService.create({
        foodListingId: id,
        requestedQuantity: qty,
        message: message.trim()
      });
      setSuccess("Your request has been submitted to the donor! Redirecting to your requests...");
      setTimeout(() => {
        navigate("/requests/my");
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit food request.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading food details...</p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="card empty-state">
        <h3>Listing Not Found</h3>
        <p>The food listing you are looking for does not exist or has been removed.</p>
        <Link to="/food" className="btn btn-primary" style={{ marginTop: "12px" }}>
          Back to Available Food
        </Link>
      </div>
    );
  }

  const donor = listing.donorId || {};
  const isDonorUser = user?.role === "donor";
  const isPendingNGO = user?.role === "ngo" && user?.verificationStatus === "pending";

  return (
    <div style={{ maxWidth: "860px", margin: "20px auto" }}>
      <Link to="/food" style={{ color: "var(--primary-dark)", fontSize: "0.9rem", textDecoration: "none", display: "inline-block", marginBottom: "16px" }}>
        ← Back to Available Food
      </Link>

      {error && <Alert type="error" message={error} onClose={() => setError("")} />}
      {success && <Alert type="success" message={success} />}

      <div className="card" style={{ padding: "28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
          <div>
            <span className="badge badge-available" style={{ marginBottom: "8px" }}>
              {listing.category}
            </span>
            <h1 style={{ fontSize: "1.85rem", fontWeight: 800, margin: "4px 0" }}>
              {listing.foodName}
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
              Donated by: <strong>{donor.organizationName || donor.name}</strong>
            </p>
          </div>
          <span className={`badge badge-${listing.status}`} style={{ fontSize: "0.85rem", padding: "6px 12px" }}>
            {listing.status.replace("_", " ")}
          </span>
        </div>

        {listing.image && (
          <div style={{ marginBottom: "24px", borderRadius: "var(--radius-md)", overflow: "hidden", maxHeight: "360px" }}>
            <img
              src={
                listing.image.startsWith("http")
                  ? listing.image
                  : `${SERVER_BASE_URL}${listing.image}`
              }
              alt={listing.foodName}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        )}

        {/* Details Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", background: "#f8fafc", padding: "18px", borderRadius: "var(--radius-sm)", marginBottom: "24px" }}>
          <div>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Available Quantity:</span>
            <p style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--primary-dark)", margin: "2px 0 0" }}>
              {listing.availableQuantity} {listing.unit}
            </p>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Total listed: {listing.quantity} {listing.unit}</span>
          </div>

          <div>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Preparation Time:</span>
            <p style={{ fontSize: "0.95rem", fontWeight: 600, margin: "2px 0 0" }}>
              {new Date(listing.preparationTime).toLocaleString()}
            </p>
          </div>

          <div>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Safe Pickup Deadline:</span>
            <p style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--danger)", margin: "2px 0 0" }}>
              {new Date(listing.safePickupDeadline).toLocaleString()}
            </p>
          </div>

          <div>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Storage Conditions:</span>
            <p style={{ fontSize: "0.95rem", fontWeight: 600, margin: "2px 0 0" }}>
              {listing.storageConditions || "Standard room temperature"}
            </p>
          </div>
        </div>

        {listing.description && (
          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "6px" }}>Description & Ingredients</h4>
            <p style={{ color: "#334155", lineHeight: 1.6 }}>{listing.description}</p>
          </div>
        )}

        {/* Revealed Contact Section (Only visible if authorized server-side) */}
        {listing.pickupInstructions ? (
          <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", padding: "18px", borderRadius: "var(--radius-sm)", marginBottom: "24px" }}>
            <h4 style={{ color: "#065f46", display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
              🔓 Donor Contact & Pickup Instructions (Revealed)
            </h4>
            <p style={{ margin: "0 0 6px", fontWeight: 600, color: "#065f46" }}>
              Pickup Location: {listing.pickupInstructions}
            </p>
            {donor.phone && (
              <p style={{ margin: "0 0 4px", fontSize: "0.9rem" }}>
                Phone: <a href={`tel:${donor.phone}`} style={{ color: "var(--primary-dark)", fontWeight: 600 }}>{donor.phone}</a>
              </p>
            )}
            {donor.email && (
              <p style={{ margin: 0, fontSize: "0.9rem" }}>
                Email: <a href={`mailto:${donor.email}`}>{donor.email}</a>
              </p>
            )}
          </div>
        ) : (
          <div style={{ background: "#f1f5f9", padding: "14px 18px", borderRadius: "var(--radius-sm)", marginBottom: "24px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
            🔒 <strong>Contact Privacy Protected:</strong> Exact pickup instructions and the donor's direct phone number will be unlocked and visible to you once the donor approves your request.
          </div>
        )}

        {/* Food Safety Notice */}
        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", borderTop: "1px solid var(--border-color)", paddingTop: "14px", marginBottom: "24px" }}>
          ✓ Verified donor food safety declaration recorded. Please follow recommended transport and storage hygiene.
        </div>

        {/* Request Form */}
        {!isDonorUser && (
          <div style={{ borderTop: "2px solid var(--border-color)", paddingTop: "20px" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "12px" }}>
              Request This Surplus Food
            </h3>

            {isPendingNGO ? (
              <div className="alert-card alert-warning" style={{ padding: "12px 16px", borderRadius: "var(--radius-sm)", background: "#fef3c7", border: "1px solid #fde68a" }}>
                Your NGO account is currently pending administrator verification. You cannot submit requests until approved.
              </div>
            ) : listing.availableQuantity <= 0 ? (
              <div className="alert-card alert-info" style={{ padding: "12px 16px", borderRadius: "var(--radius-sm)", background: "#eff6ff" }}>
                All quantities for this listing have been reserved.
              </div>
            ) : (
              <form onSubmit={handleRequestSubmit}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "16px", marginBottom: "14px" }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label htmlFor="reqQty">Quantity Needed ({listing.unit})</label>
                    <input
                      id="reqQty"
                      type="number"
                      min="1"
                      max={listing.availableQuantity}
                      step="any"
                      className="form-control"
                      value={requestedQuantity}
                      onChange={(e) => setRequestedQuantity(e.target.value)}
                      required
                    />
                    <span className="form-hint">Max: {listing.availableQuantity}</span>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label htmlFor="reqMsg">Message to Donor (Optional)</label>
                    <input
                      id="reqMsg"
                      type="text"
                      className="form-control"
                      placeholder="e.g. For dinner distribution at City Night Shelter"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: "100%", padding: "12px" }}
                  disabled={submitting}
                >
                  {submitting ? "Submitting Request..." : `Request ${requestedQuantity || 0} ${listing.unit}`}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FoodDetails;
