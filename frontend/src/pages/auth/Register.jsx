import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Alert from "../../components/Alert";

export const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "donor",
    organizationName: "",
    organizationDescription: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.name.trim()) {
      setError("Please provide your name.");
      return;
    }
    if (!formData.email.trim()) {
      setError("Please provide your email address.");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    // Organization name is required for NGOs per specifications
    if (formData.role === "ngo" && !formData.organizationName.trim()) {
      setError("Organization Name is required when registering as an NGO.");
      return;
    }

    try {
      setLoading(true);
      const user = await register(formData);

      if (user.role === "donor") {
        navigate("/donor/dashboard", { replace: true });
      } else if (user.role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/food", { replace: true });
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Registration failed. Please check your details."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "520px", margin: "40px auto" }}>
      <div className="card">
        <div className="page-header" style={{ textAlign: "center", marginBottom: "20px" }}>
          <h2>Join FoodLoop</h2>
          <p>Create an account to start redistributing or receiving surplus food</p>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError("")} />}

        <form onSubmit={handleSubmit}>
          {/* Role Selection */}
          <div className="form-group">
            <label htmlFor="role">Select Your Role</label>
            <select
              id="role"
              name="role"
              className="form-control"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="donor">Food Donor (Restaurant, Hotel, Caterer, Household)</option>
              <option value="ngo">NGO / Food Bank / Charitable Trust</option>
              <option value="volunteer">Individual Volunteer</option>
            </select>
            {formData.role === "ngo" && (
              <p className="form-hint" style={{ color: "var(--warning-text)" }}>
                ℹ️ NGO accounts require administrator verification before submitting food requests.
              </p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              name="name"
              type="text"
              className="form-control"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Arpit Sharma"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              className="form-control"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@domain.org"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password (min 6 characters)</label>
            <input
              id="password"
              name="password"
              type="password"
              className="form-control"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              minLength={6}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              className="form-control"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+91 98765 43210"
            />
            <p className="form-hint">
              {formData.role === "donor"
                ? "Your phone number is only revealed to approved requesters for collection."
                : "Used by donors and administrators for pickup coordination."}
            </p>
          </div>

          {/* Organization Fields (Required for NGO, Optional for others) */}
          {(formData.role === "ngo" || formData.role === "donor") && (
            <>
              <div className="form-group">
                <label htmlFor="organizationName">
                  Organization / Business Name {formData.role === "ngo" && <span style={{ color: "var(--danger)" }}>*</span>}
                </label>
                <input
                  id="organizationName"
                  name="organizationName"
                  type="text"
                  className="form-control"
                  value={formData.organizationName}
                  onChange={handleChange}
                  placeholder={
                    formData.role === "ngo"
                      ? "e.g. Feeding Hope Foundation (Required)"
                      : "e.g. Grand Banquet Hall (Optional)"
                  }
                  required={formData.role === "ngo"}
                />
              </div>

              <div className="form-group">
                <label htmlFor="organizationDescription">Organization Description (Optional)</label>
                <textarea
                  id="organizationDescription"
                  name="organizationDescription"
                  className="form-control"
                  value={formData.organizationDescription}
                  onChange={handleChange}
                  placeholder="Briefly describe your food distribution activities or catering operations..."
                  rows={2}
                />
              </div>
            </>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "12px" }}
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Register"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "20px", fontSize: "0.9rem" }}>
          <p style={{ color: "var(--text-muted)" }}>
            Already registered?{" "}
            <Link to="/login" style={{ color: "var(--primary-dark)", fontWeight: 600 }}>
              Log in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
