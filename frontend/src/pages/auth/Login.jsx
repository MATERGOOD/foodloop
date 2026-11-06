import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Alert from "../../components/Alert";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please provide both email and password.");
      return;
    }

    try {
      setLoading(true);
      const user = await login(email, password);
      // Navigate to destination from location.state or appropriate role home
      const destination = location.state?.from?.pathname;
      if (destination) {
        navigate(destination, { replace: true });
      } else if (user.role === "donor") {
        navigate("/donor/dashboard", { replace: true });
      } else if (user.role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/food", { replace: true });
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "440px", margin: "40px auto" }}>
      <div className="card">
        <div className="page-header" style={{ textAlign: "center", marginBottom: "20px" }}>
          <h2>Log In to FoodLoop</h2>
          <p>Access your donations, requests, and dashboard</p>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError("")} />}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "8px" }}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Log In"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "20px", fontSize: "0.9rem" }}>
          <p style={{ color: "var(--text-muted)" }}>
            Don't have an account?{" "}
            <Link to="/register" style={{ color: "var(--primary-dark)", fontWeight: 600 }}>
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
