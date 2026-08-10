import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}/api`;


const getAuthHeaders = () => {

  const token = localStorage.getItem('token');

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};


/* =========================================================
   GET PARCELS
========================================================= */

export const getParcels = async () => {

  const response = await axios.get(
    `${API_URL}/parcels`
  );

  return Array.isArray(response.data)
    ? response.data
    : [];

};


/* =========================================================
   GET DRIVERS
========================================================= */

export const getDrivers = async () => {

  const response = await axios.get(
    `${API_URL}/drivers`
  );

  return Array.isArray(response.data)
    ? response.data
    : [];

};


/* =========================================================
   GET ASSIGNMENTS
========================================================= */

export const getAssignments = async () => {

  const token = localStorage.getItem("token");

  if (!token) {

    throw new Error(
      "Authentication token not found. Please login again."
    );

  }

  const response = await axios.get(
    `${API_URL}/assignments`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return Array.isArray(response.data)
    ? response.data
    : [];

};


/* =========================================================
   GET EVERYTHING
========================================================= */

export const getDashboardData = async () => {

  const [
    parcels,
    drivers,
    assignments,
  ] = await Promise.all([
    getParcels(),
    getDrivers(),
    getAssignments(),
  ]);

  return {
    parcels,
    drivers,
    assignments,
  };

};