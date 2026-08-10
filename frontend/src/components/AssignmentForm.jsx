import { useEffect, useState } from "react";
import axios from "axios";

function AssignmentForm({ onAssignmentCreated }) {

    const [parcels, setParcels] = useState([]);
    const [drivers, setDrivers] = useState([]);

    const [parcelId, setParcelId] = useState("");
    const [driverId, setDriverId] = useState("");

    useEffect(() => {

        loadParcels();
        loadDrivers();

    }, []);

    const loadParcels = async () => {

        try {

            const res = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/parcels`
            );

            const pendingParcels = res.data.filter(
                (parcel) =>
                    parcel.status === `Pending`
            );

            setParcels(pendingParcels);

        } catch (error) {

            console.error(error);

        }

    };

    const loadDrivers = async () => {

        try {

            const res = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/drivers`
            );

            const availableDrivers = res.data.filter(
                (driver) =>
                    driver.status === `Available" ||
                    driver.status === "Active"
            );

            setDrivers(availableDrivers);

        } catch (error) {

            console.error(error);

        }

    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            const token = localStorage.getItem("token");

            await axios.post(
                `${import.meta.env.VITE_API_URL}/api/assignments`,
                {
                    parcel_id: parcelId,
                    driver_id: driverId
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            alert('Driver Assigned Successfully');

            setParcelId("");
            setDriverId("");

            loadParcels();
            loadDrivers();

            if (onAssignmentCreated) {
                onAssignmentCreated();
            }

        } catch (error) {

            console.error(error);

            alert(
                error.response?.data?.message ||
                "Assignment Failed"
            );

        }

    };

    return (

        <div className="card shadow mb-4">

            <div className="card-header bg-primary text-white">

                <h4>

                    Assign Driver

                </h4>

            </div>

            <div className="card-body">

                <form onSubmit={handleSubmit}>

                    <div className="row">

                        <div className="col-md-6 mb-3">

                            <label>

                                Parcel

                            </label>

                            <select
                                className="form-select"
                                value={parcelId}
                                onChange={(e) =>
                                    setParcelId(
                                        e.target.value
                                    )
                                }
                                required
                            >

                                <option value="">
                                    Select Parcel
                                </option>

                                {

                                    parcels.map(parcel => (

                                        <option
                                            key={parcel.id}
                                            value={parcel.id}
                                        >

                                            #{parcel.id} -
                                            {parcel.pickup_address}
                                            →
                                            {parcel.drop_address}

                                        </option>

                                    ))

                                }

                            </select>

                        </div>

                        <div className="col-md-6 mb-3">

                            <label>

                                Driver

                            </label>

                            <select
                                className="form-select"
                                value={driverId}
                                onChange={(e) =>
                                    setDriverId(
                                        e.target.value
                                    )
                                }
                                required
                            >

                                <option value="">
                                    Select Driver
                                </option>

                                {

                                    drivers.map(driver => (

                                        <option
                                            key={driver.id}
                                            value={driver.id}
                                        >

                                            {driver.full_name}

                                            (

                                            {driver.vehicle_number}

                                            )

                                        </option>

                                    ))

                                }

                            </select>

                        </div>

                    </div>

                    <button
                        className="btn btn-success"
                    >

                        Assign Driver

                    </button>

                </form>

            </div>

        </div>

    );

}

export default AssignmentForm;