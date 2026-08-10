import api from "./api";

// Get all assignments
export const getAllAssignments = async () => {
    const response = await api.get("/assignments");
    return response.data;
};

// Assign driver
export const createAssignment = async (data) => {
    const response = await api.post("/assignments", data);
    return response.data;
};

// Complete delivery
export const completeAssignment = async (id) => {
    const response = await api.put(
        `/assignments/${id}/complete`
    );
    return response.data;
};

// Assignment history
export const getAssignmentHistory = async () => {
    const response = await api.get(
        "/assignments/history"
    );
    return response.data;
};

// Analytics
export const getAssignmentAnalytics = async () => {
    const response = await api.get(
        "/assignments/analytics"
    );
    return response.data;
};