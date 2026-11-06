import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";

// Public Pages
import Home from "./pages/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// Food Pages
import AvailableFood from "./pages/ngo/AvailableFood";
import FoodDetails from "./pages/ngo/FoodDetails";

// Donor Pages
import DonorDashboard from "./pages/donor/DonorDashboard";
import AddDonation from "./pages/donor/AddDonation";
import MyDonations from "./pages/donor/MyDonations";
import ReceivedRequests from "./pages/donor/ReceivedRequests";

// NGO / Volunteer Pages
import MyRequests from "./pages/ngo/MyRequests";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import ReportManagement from "./pages/admin/ReportManagement";

// Shared Pages
import NotificationsPage from "./pages/NotificationsPage";

export const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          {/* Public Routes */}
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="food" element={<AvailableFood />} />
          <Route path="food/:id" element={<FoodDetails />} />

          {/* Donor Protected Routes */}
          <Route
            path="donor/dashboard"
            element={
              <ProtectedRoute allowedRoles={["donor"]}>
                <DonorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="donor/add"
            element={
              <ProtectedRoute allowedRoles={["donor"]}>
                <AddDonation />
              </ProtectedRoute>
            }
          />
          <Route
            path="donor/donations"
            element={
              <ProtectedRoute allowedRoles={["donor"]}>
                <MyDonations />
              </ProtectedRoute>
            }
          />
          <Route
            path="donor/requests"
            element={
              <ProtectedRoute allowedRoles={["donor"]}>
                <ReceivedRequests />
              </ProtectedRoute>
            }
          />

          {/* NGO / Volunteer Protected Routes */}
          <Route
            path="requests/my"
            element={
              <ProtectedRoute allowedRoles={["ngo", "volunteer"]}>
                <MyRequests />
              </ProtectedRoute>
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/users"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/reports"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <ReportManagement />
              </ProtectedRoute>
            }
          />

          {/* Shared Authenticated Routes */}
          <Route
            path="notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
