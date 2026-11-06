import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { foodService } from "../../services/api";
import Alert from "../../components/Alert";

export const AddDonation = () => {
  const navigate = useNavigate();

  // Helper to format Date to input datetime-local string
  const toDateTimeLocal = (date) => {
    const pad = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
      date.getHours()
    )}:${pad(date.getMinutes())}`;
  };

  const defaultPrep = toDateTimeLocal(new Date(Date.now() - 3600000)); // 1 hr ago
  const defaultDeadline = toDateTimeLocal(new Date(Date.now() + 86400000)); // 24 hrs from now

  const [formData, setFormData] = useState({
    foodName: "",
    description: "",
    category: "cooked",
    quantity: "",
    unit: "meals",
    preparationTime: defaultPrep,
    safePickupDeadline: defaultDeadline,
    storageConditions: "Room temperature",
    pickupInstructions: "",
    foodSafetyDeclaration: false
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("Image file size exceeds the 2MB limit.");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.foodName.trim()) {
      setError("Please provide a food name.");
      return;
    }

    const qty = Number(formData.quantity);
    if (isNaN(qty) || qty <= 0) {
      setError("Quantity must be a positive number.");
      return;
    }

    if (!formData.foodSafetyDeclaration) {
      setError("You must confirm the food safety declaration before submitting.");
      return;
    }

    const prep = new Date(formData.preparationTime);
    const deadline = new Date(formData.safePickupDeadline);

    if (deadline <= new Date()) {
      setError("Safe pickup deadline must be in the future.");
      return;
    }

    if (deadline <= prep) {
      setError("Safe pickup deadline must be after preparation time.");
      return;
    }

    try {
      setLoading(true);

      const data = new FormData();
      data.append("foodName", formData.foodName.trim());
      data.append("description", formData.description.trim());
      data.append("category", formData.category);
      data.append("quantity", qty);
      data.append("unit", formData.unit.trim());
      data.append("preparationTime", prep.toISOString());
      data.append("safePickupDeadline", deadline.toISOString());
      data.append("storageConditions", formData.storageConditions.trim());
      data.append("foodSafetyDeclaration", "true");
      data.append("pickupInstructions", formData.pickupInstructions.trim());

      if (imageFile) {
        data.append("image", imageFile);
      }

      await foodService.create(data);
      setSuccess("Food listing created successfully! Redirecting...");
      setTimeout(() => {
        navigate("/donor/donations");
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create food listing.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "680px", margin: "20px auto" }}>
      <div className="card">
        <div className="page-header" style={{ marginBottom: "20px" }}>
          <h2>List Surplus Food for Donation</h2>
          <p>
            Provide accurate details so verified NGOs and volunteers can safely collect and distribute this food.
          </p>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError("")} />}
        {success && <Alert type="success" message={success} />}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="foodName">
              Food Name <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <input
              id="foodName"
              name="foodName"
              type="text"
              className="form-control"
              value={formData.foodName}
              onChange={handleChange}
              placeholder="e.g. Steamed Rice & Dal Makhani"
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div className="form-group">
              <label htmlFor="category">
                Category <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <select
                id="category"
                name="category"
                className="form-control"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="cooked">Cooked Meals</option>
                <option value="packaged">Packaged / Dry Goods</option>
                <option value="fruits">Fruits & Vegetables</option>
                <option value="bakery">Bakery & Breads</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="quantity">
                Quantity <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="0.1"
                  step="any"
                  className="form-control"
                  value={formData.quantity}
                  onChange={handleChange}
                  placeholder="e.g. 50"
                  required
                />
                <input
                  id="unit"
                  name="unit"
                  type="text"
                  className="form-control"
                  style={{ width: "120px" }}
                  value={formData.unit}
                  onChange={handleChange}
                  placeholder="meals"
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description (Optional)</label>
            <textarea
              id="description"
              name="description"
              className="form-control"
              value={formData.description}
              onChange={handleChange}
              placeholder="Provide ingredients, allergen details, packaging (e.g. foil containers), etc."
              rows={2}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div className="form-group">
              <label htmlFor="preparationTime">
                Preparation Time <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <input
                id="preparationTime"
                name="preparationTime"
                type="datetime-local"
                className="form-control"
                value={formData.preparationTime}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="safePickupDeadline">
                Safe Pickup Deadline <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <input
                id="safePickupDeadline"
                name="safePickupDeadline"
                type="datetime-local"
                className="form-control"
                value={formData.safePickupDeadline}
                onChange={handleChange}
                required
              />
              <p className="form-hint">Listing expires if uncollected past this deadline.</p>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="storageConditions">Storage & Transport Conditions</label>
            <input
              id="storageConditions"
              name="storageConditions"
              type="text"
              className="form-control"
              value={formData.storageConditions}
              onChange={handleChange}
              placeholder="e.g. Keep insulated, refrigerate within 2 hours"
            />
          </div>

          <div className="form-group">
            <label htmlFor="pickupInstructions">
              Pickup Instructions & Exact Location
            </label>
            <textarea
              id="pickupInstructions"
              name="pickupInstructions"
              className="form-control"
              value={formData.pickupInstructions}
              onChange={handleChange}
              placeholder="e.g. Service Gate 3, Banquet Kitchen. Ask for Chef Rohit. (Only shown to approved requester)"
              rows={2}
            />
            <p className="form-hint" style={{ color: "var(--primary-dark)" }}>
              🔒 Privacy Guaranteed: Instructions and phone number are hidden until you approve a request.
            </p>
          </div>

          {/* Image Upload */}
          <div className="form-group">
            <label htmlFor="image">Food Photo (Optional, max 2MB)</label>
            <input
              id="image"
              name="image"
              type="file"
              accept="image/*"
              className="form-control"
              onChange={handleImageChange}
            />
            {imagePreview && (
              <div style={{ marginTop: "10px" }}>
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{
                    maxHeight: "160px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border-color)"
                  }}
                />
              </div>
            )}
          </div>

          {/* Food Safety Declaration */}
          <div
            style={{
              background: "#ecfdf5",
              border: "1px solid #a7f3d0",
              borderRadius: "var(--radius-sm)",
              padding: "14px",
              margin: "20px 0"
            }}
          >
            <label className="form-checkbox" style={{ margin: 0 }}>
              <input
                type="checkbox"
                name="foodSafetyDeclaration"
                checked={formData.foodSafetyDeclaration}
                onChange={handleChange}
                required
              />
              <span style={{ fontWeight: 600, color: "#065f46" }}>
                Food Safety Declaration: I declare that this food was prepared and stored in clean, hygienic conditions, is fit for human consumption, and adheres to food safety standards.
              </span>
            </label>
          </div>

          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate("/donor/dashboard")}
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Publishing Donation..." : "Publish Food Donation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDonation;
