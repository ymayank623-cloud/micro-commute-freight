import api from "./api";

// Get All Parcels
export const getAllParcels = async () => {
    const response = await api.get("/parcels");
    return response.data;
};

// Book Parcel
export const createParcel = async (parcel) => {
    const response = await api.post("/parcels", parcel);
    return response.data;
};

// Edit Parcel
export const updateParcel = async (id, parcel) => {
    const response = await api.put(`/parcels/${id}`, parcel);
    return response.data;
};

// Update Status
export const updateParcelStatus = async (id, status) => {
    const response = await api.put(`/parcels/${id}/status`, {
        status,
    });
    return response.data;
};

// Delete Parcel
export const deleteParcel = async (id) => {
    const response = await api.delete(`/parcels/${id}`);
    return response.data;
};