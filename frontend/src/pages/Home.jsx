import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const Home = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section card" style={{ textAlign: "center", padding: "48px 24px", background: "linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)", borderColor: "#a7f3d0", marginBottom: "40px" }}>
        <h1 style={{ fontSize: "2.6rem", fontWeight: 800, color: "#065f46", marginBottom: "16px" }}>
          Redistributing Surplus Food, Ending Hunger
        </h1>
        <p style={{ fontSize: "1.15rem", color: "#334155", maxWidth: "720px", margin: "0 auto 28px" }}>
          <strong>FoodLoop</strong> connects food donors (restaurants, caterers, banquet halls, and individuals) with verified NGOs and passionate volunteers to ensure surplus food reaches people in need safely and promptly.
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          {isAuthenticated ? (
            <Link
              to={
                user?.role === "donor"
                  ? "/donor/dashboard"
                  : user?.role === "admin"
                  ? "/admin/dashboard"
                  : "/food"
              }
              className="btn btn-primary"
              style={{ fontSize: "1.05rem", padding: "12px 24px" }}
            >
              Go to Your Dashboard ({user?.role}) →
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn btn-primary" style={{ fontSize: "1.05rem", padding: "12px 24px" }}>
                Join FoodLoop Today
              </Link>
              <Link to="/food" className="btn btn-secondary" style={{ fontSize: "1.05rem", padding: "12px 24px" }}>
                Browse Available Food
              </Link>
            </>
          )}
        </div>
      </section>

      {/* How It Works Section */}
      <section style={{ marginBottom: "48px" }}>
        <div className="page-header" style={{ textAlign: "center" }}>
          <h2>How FoodLoop Works</h2>
          <p>A transparent, safe, and accountable 5-step redistribution workflow</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginTop: "24px" }}>
          <div className="card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🥗</div>
            <h4 style={{ fontWeight: 700, marginBottom: "8px" }}>1. Donors List Food</h4>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Donors submit details: quantity, category, preparation time, safe deadline, storage conditions, and food safety declaration.
            </p>
          </div>

          <div className="card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🔍</div>
            <h4 style={{ fontWeight: 700, marginBottom: "8px" }}>2. NGOs Browse</h4>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Verified NGOs & volunteers browse available food filtered by urgency. Donor contact info remains private and secure.
            </p>
          </div>

          <div className="card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "2rem", marginBottom: "8px" }}>✅</div>
            <h4 style={{ fontWeight: 700, marginBottom: "8px" }}>3. Donor Approves</h4>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              The donor reviews the request and approves it with atomic reservation. Only the approved requester receives pickup instructions and contact info.
            </p>
          </div>

          <div className="card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🚚</div>
            <h4 style={{ fontWeight: 700, marginBottom: "8px" }}>4. Safe Handover</h4>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              The requester arrives at the location before the deadline. Both parties confirm collection and handover.
            </p>
          </div>

          <div className="card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "2rem", marginBottom: "8px" }}>📊</div>
            <h4 style={{ fontWeight: 700, marginBottom: "8px" }}>5. Impact Recorded</h4>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              The NGO logs the exact distributed count and beneficiaries fed. Administrators monitor reports and community statistics.
            </p>
          </div>
        </div>
      </section>

      {/* Role Cards Section */}
      <section style={{ marginBottom: "32px" }}>
        <div className="page-header" style={{ textAlign: "center" }}>
          <h2>Roles & Responsibilities</h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
          <div className="card">
            <h3 style={{ color: "var(--primary-dark)", marginBottom: "8px" }}>🍱 Food Donors</h3>
            <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "12px" }}>
              Restaurants, caterers, hotels, and event organizers:
            </p>
            <ul style={{ paddingLeft: "20px", fontSize: "0.88rem", color: "#334155", display: "flex", flexDirection: "column", gap: "6px" }}>
              <li>Post surplus food with photos & safety declarations</li>
              <li>Prevent food waste with customized pickup windows</li>
              <li>Approve or decline requests with atomic reservation</li>
              <li>Confirm handover securely</li>
            </ul>
          </div>

          <div className="card">
            <h3 style={{ color: "var(--secondary-dark)", marginBottom: "8px" }}>🤝 NGOs & Volunteers</h3>
            <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "12px" }}>
              Registered non-profits and community volunteers:
            </p>
            <ul style={{ paddingLeft: "20px", fontSize: "0.88rem", color: "#334155", display: "flex", flexDirection: "column", gap: "6px" }}>
              <li>Get verified by FoodLoop admins</li>
              <li>Request urgent food donations before deadlines expire</li>
              <li>Receive donor address and direct contact upon approval</li>
              <li>Record distribution metrics and beneficiary counts</li>
            </ul>
          </div>

          <div className="card">
            <h3 style={{ color: "#7c3aed", marginBottom: "8px" }}>🛡️ Administrators</h3>
            <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "12px" }}>
              Platform coordinators ensuring quality and safety:
            </p>
            <ul style={{ paddingLeft: "20px", fontSize: "0.88rem", color: "#334155", display: "flex", flexDirection: "column", gap: "6px" }}>
              <li>Verify and approve NGO accounts</li>
              <li>Monitor real-time food donations & distributions</li>
              <li>Review moderation reports and resolve disputes</li>
              <li>Automated cron jobs handling expiration</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
