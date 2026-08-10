import { useState, useEffect } from "react";

function ParcelForm({ onSubmit, editingParcel }) {
  const [formData, setFormData] = useState({
    sender_name: "",
    receiver_name: "",
    pickup_address: "",
    delivery_address: "",
    weight: "",
    status: "Pending",
  });

  useEffect(() => {
    if (editingParcel) {
      setFormData({
        sender_name: editingParcel.sender_name || "",
        receiver_name: editingParcel.receiver_name || "",
        pickup_address: editingParcel.pickup_address || "",
        delivery_address: editingParcel.delivery_address || "",
        weight: editingParcel.weight || "",
        status: editingParcel.status || "Pending",
      });
    }
  }, [editingParcel]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    onSubmit(formData);

    if (!editingParcel) {
      setFormData({
        sender_name: "",
        receiver_name: "",
        pickup_address: "",
        delivery_address: "",
        weight: "",
        status: "Pending",
      });
    }
  };

  return (
    <div className="card shadow p-4 mb-4">
      <h3 className="mb-4">
        {editingParcel ? "Update Parcel" : "Add Parcel"}
      </h3>

      <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="col-md-6 mb-3">
            <label>Sender Name</label>
            <input
              type="text"
              className="form-control"
              name="sender_name"
              value={formData.sender_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-md-6 mb-3">
            <label>Receiver Name</label>
            <input
              type="text"
              className="form-control"
              name="receiver_name"
              value={formData.receiver_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-md-6 mb-3">
            <label>Pickup Address</label>
            <input
              type="text"
              className="form-control"
              name="pickup_address"
              value={formData.pickup_address}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-md-6 mb-3">
            <label>Delivery Address</label>
            <input
              type="text"
              className="form-control"
              name="delivery_address"
              value={formData.delivery_address}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-md-6 mb-3">
            <label>Weight (kg)</label>
            <input
              type="number"
              className="form-control"
              name="weight"
              value={formData.weight}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-md-6 mb-3">
            <label>Status</label>

            <select
              className="form-control"
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="Pending">Pending</option>
              <option value="Assigned">Assigned</option>
              <option value="In Transit">In Transit</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>
        </div>

        <button className="btn btn-primary">
          {editingParcel ? "Update Parcel" : "Add Parcel"}
        </button>
      </form>
    </div>
  );
}

export default ParcelForm;