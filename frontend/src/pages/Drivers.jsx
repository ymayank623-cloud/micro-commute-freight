import { useEffect, useState } from "react";

import DriverForm from "../components/DriverForm";
import DriverTable from "../components/DriverTable";

import {
    getAllDrivers,
    createDriver,
    updateDriver,
    deleteDriver
} from "../services/driverService";

function Drivers() {

    const [drivers, setDrivers] = useState([]);

    const [editingDriver, setEditingDriver] = useState(null);

    const [search, setSearch] = useState("");

    const loadDrivers = async () => {

        try {

            const data = await getAllDrivers();

            setDrivers(data);

        } catch (error) {

            console.error(error);

        }

    };

    useEffect(() => {

        loadDrivers();

    }, []);

    const handleSubmit = async (driverData) => {
        try {
            if (editingDriver) {
                await updateDriver(
                    editingDriver.id,
                    driverData
                );
                setEditingDriver(null);
            } else {
                await createDriver(driverData);
            }
            loadDrivers();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "Failed to register driver.");
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteDriver(id);
            loadDrivers();
        } catch (error) {
            console.error(error);
        }
    };

    const filteredDrivers = drivers.filter((driver) => {
        const keyword = search.toLowerCase();
        return (
            driver.full_name.toLowerCase().includes(keyword)
            ||
            driver.email.toLowerCase().includes(keyword)
            ||
            driver.phone.toLowerCase().includes(keyword)
            ||
            driver.vehicle_number.toLowerCase().includes(keyword)
            ||
            driver.license_number.toLowerCase().includes(keyword)
        );
    });

    return (
        <div className="container mt-4">
            <h1 className="mb-4 neon-text">
                Driver Management
            </h1>

            <DriverForm
                onSubmit={handleSubmit}
                editingDriver={editingDriver}
                existingDrivers={drivers}
                cancelEdit={() => setEditingDriver(null)}
            />

            <div className="glass-panel mb-4 p-2">

                <div className="card-body">

                    <input

                        className="form-control"

                        placeholder="Search by name, phone, vehicle or license..."

                        value={search}

                        onChange={(e) =>
                            setSearch(e.target.value)
                        }

                    />

                </div>

            </div>

            <DriverTable

                drivers={filteredDrivers}

                onEdit={setEditingDriver}

                onDelete={handleDelete}

            />

        </div>

    );

}

export default Drivers;