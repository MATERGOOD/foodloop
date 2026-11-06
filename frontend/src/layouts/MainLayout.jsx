import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";

export const MainLayout = () => {
  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
      <footer className="footer">
        <div className="footer-container">
          <p>© {new Date().getFullYear()} FoodLoop — Surplus Food Redistribution System</p>
          <p className="footer-tagline">
            Connecting surplus food donors with verified NGOs and volunteers to feed communities.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
