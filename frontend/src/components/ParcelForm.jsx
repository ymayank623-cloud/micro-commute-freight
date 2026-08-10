import { useEffect, useState } from "react";

function ParcelForm({
    onSubmit,
    editingParcel,
    cancelEdit
}) {

    const [formData, setFormData] = useState({
        pickup_address: "",
        drop_address: "",
        weight: "",
        parcel_type: "",
        pickup_date: ""
    });

    useEffect(() => {

        if (editingParcel) {

            setFormData({
                pickup_address: editingParcel.pickup_address,
                drop_address: editingParcel.drop_address,
                weight: editingParcel.weight,
                parcel_type: editingParcel.parcel_type,
                pickup_date:
                    editingParcel.pickup_date?.substring(0, 10)
            });

        } else {

            setFormData({
                pickup_address: "",
                drop_address: "",
                weight: "",
                parcel_type: "",
                pickup_date: ""
            });

        }

    }, [editingParcel]);

    const handleChange = (e) => {

        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });

    };

    const handleSubmit = (e) => {

        e.preventDefault();

        onSubmit(formData);

    };

    return (

        <div className="card shadow p-4 mb-4">

            <h3>

                {editingParcel
                    ? "Edit Parcel"
                    : "Book Parcel"}

            </h3>

            <form onSubmit={handleSubmit}>

                <div className="row">

                    <div className="col-md-6 mb-3">

                        <label>Pickup Address</label>

                        <input
                            className="form-control"
                            name="pickup_address"
                            value={formData.pickup_address}
                            onChange={handleChange}
                            required
                        />

                    </div>

                    <div className="col-md-6 mb-3">

                        <label>Drop Address</label>

                        <input
                            className="form-control"
                            name="drop_address"
                            value={formData.drop_address}
                            onChange={handleChange}
                            required
                        />

                    </div>

                    <div className="col-md-4 mb-3">

                        <label>Weight</label>

                        <input
                            type="number"
                            className="form-control"
                            name="weight"
                            value={formData.weight}
                            onChange={handleChange}
                            required
                        />

                    </div>

                    <div className="col-md-4 mb-3">

                        <label>Parcel Type</label>

                        <input
                            className="form-control"
                            name="parcel_type"
                            value={formData.parcel_type}
                            onChange={handleChange}
                            required
                        />

                    </div>

                    <div className="col-md-4 mb-3">

                        <label>Pickup Date</label>

                        <input
                            type="date"
                            className="form-control"
                            name="pickup_date"
                            value={formData.pickup_date}
                            onChange={handleChange}
                            required
                        />

                    </div>

                </div>

                <button className="btn btn-primary">

                    {editingParcel
                        ? "Update Parcel"
                        : "Book Parcel"}

                </button>

                {editingParcel && (

                    <button
                        type="button"
                        className="btn btn-secondary ms-2"
                        onClick={cancelEdit}
                    >
                        Cancel
                    </button>

                )}

            </form>

        </div>

    );

}

export default ParcelForm;