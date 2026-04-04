import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";

// Route protégée : vérifie le token ET le rôle
function ProtectedRoute({ children, requiredRole }) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (!token) return <Navigate to="/login" replace />;
  if (requiredRole && user.role !== requiredRole) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Dashboards protégés */}
        <Route
          path="/dashboard/employee"
          element={
            <ProtectedRoute requiredRole="EMPLOYEE">
              <EmployeeDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/manager"
          element={
            <ProtectedRoute requiredRole="MANAGER">
              <ManagerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Redirection par défaut */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}