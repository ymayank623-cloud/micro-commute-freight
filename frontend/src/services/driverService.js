import api from "./api";

// ===============================
// Get All Drivers
// ===============================
export const getAllDrivers = async () => {
    try {

        const response = await api.get("/drivers");

        return response.data;

    } catch (error) {

        console.error("Error fetching drivers:", error);

        return [];

    }
};

// ===============================
// Get Driver By ID
// ===============================
export const getDriverById = async (id) => {
    try {

        const response = await api.get(`/drivers/${id}`);

        return response.data;

    } catch (error) {

        console.error("Error fetching driver:", error);

        return null;

    }
};

// ===============================
// Add Driver
// ===============================
export const createDriver = async (driverData) => {
    try {

        const response = await api.post(
            "/drivers",
            driverData
        );

        return response.data;

    } catch (error) {

        console.error("Error adding driver:", error);

        throw error;

    }
};

// ===============================
// Update Driver
// ===============================
export const updateDriver = async (id, driverData) => {
    try {

        const response = await api.put(
            `/drivers/${id}`,
            driverData
        );

        return response.data;

    } catch (error) {

        console.error("Error updating driver:", error);

        throw error;

    }
};

// ===============================
// Delete Driver
// ===============================
export const deleteDriver = async (id) => {
    try {

        const response = await api.delete(
            `/drivers/${id}`
        );

        return response.data;

    } catch (error) {

        console.error("Error deleting driver:", error);

        throw error;

    }
};