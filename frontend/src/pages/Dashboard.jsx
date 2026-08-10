import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AdminDashboard from "./AdminDashboard";
import UserDashboard from "./UserDashboard";

function Dashboard() {
    const { user } = useAuth();

    if (!user) {
        return null;
    }

    if (user.role === "admin") {
        return <AdminDashboard />;
    }

    if (user.role === "driver") {
        return <Navigate to="/driver/dashboard" />;
    }

    return <UserDashboard />;
}

export default Dashboard;
