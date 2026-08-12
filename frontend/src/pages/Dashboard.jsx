import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AdminDashboard from "./AdminDashboard";
import UserDashboard from "./UserDashboard";

function Dashboard() {
    const { user, loading } = useAuth();

    if (user?.role === "driver") {
        return <Navigate to="/driver/dashboard" />;
    }

    if (user?.role === "user") {
        return <UserDashboard />;
    }

    // Default to AdminDashboard (handles both admin role and initial token fallback)
    return <AdminDashboard />;
}

export default Dashboard;
