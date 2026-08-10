import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import DriverLogin from "./pages/DriverLogin";
import DriverRegister from "./pages/DriverRegister";
import DriverDashboard from "./pages/DriverDashboard";

import Dashboard from "./pages/Dashboard";
import Parcels from "./pages/Parcels";
import UserParcels from "./pages/UserParcels";
import BookParcel from "./pages/BookParcel";
import Drivers from "./pages/Drivers";
import CityManagers from "./pages/CityManagers";
import Assignments from "./pages/Assignments";
import Tracking from "./pages/Tracking";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import AdminNotifications from "./pages/AdminNotifications";
import DispatchRulesPage from "./pages/DispatchRulesPage";

import MainLayout from "./layout/MainLayout";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import AdminBot from "./components/AdminBot";

const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem("token");
    return token ? children : <Navigate to="/login" />;
};

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <BrowserRouter>

            <Routes>

                {/* Public */}

                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/driver/login" element={<DriverLogin />} />
                <Route path="/driver/register" element={<DriverRegister />} />

                {/* Protected */}

                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <MainLayout>
                                <Dashboard />
                            </MainLayout>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/driver/dashboard"
                    element={
                        <ProtectedRoute>
                            <MainLayout>
                                <DriverDashboard />
                            </MainLayout>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/parcels"
                    element={
                        <ProtectedRoute>
                            <MainLayout>
                                <Parcels />
                            </MainLayout>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/my-parcels"
                    element={
                        <ProtectedRoute>
                            <MainLayout>
                                <UserParcels />
                            </MainLayout>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/book-parcel"
                    element={
                        <ProtectedRoute>
                            <MainLayout>
                                <BookParcel />
                            </MainLayout>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/city-managers"
                    element={
                        <ProtectedRoute>
                            <MainLayout>
                                <CityManagers />
                            </MainLayout>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/drivers"
                    element={
                        <ProtectedRoute>
                            <MainLayout>
                                <CityManagers />
                            </MainLayout>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/assignments"
                    element={<Navigate to="/parcels" replace />}
                />

                {/* Placeholder pages */}

                <Route
                    path="/tracking"
                    element={
                        <ProtectedRoute>
                            <MainLayout>
                                <Tracking />
                            </MainLayout>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/analytics"
                    element={
                        <ProtectedRoute>
                            <MainLayout>
                                <Analytics />
                            </MainLayout>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/dispatch-rules"
                    element={
                        <ProtectedRoute>
                            <MainLayout>
                                <DispatchRulesPage />
                            </MainLayout>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/settings"
                    element={
                        <ProtectedRoute>
                            <MainLayout>
                                <Settings />
                            </MainLayout>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/notifications"
                    element={
                        <ProtectedRoute>
                            <MainLayout>
                                <AdminNotifications />
                            </MainLayout>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/"
                    element={<Navigate to="/dashboard" />}
                />

                <Route
                    path="*"
                    element={<Navigate to="/" />}
                />

            </Routes>

            <AdminBot />

            </BrowserRouter>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;