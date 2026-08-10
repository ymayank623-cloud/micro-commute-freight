function DriverTable({
    drivers,
    onEdit,
    onDelete
}) {

    const getStatusBadge = (status) => {

        switch (status) {

            case "Active":
                return "bg-success";

            case "Busy":
                return "bg-warning text-dark";

            case "Offline":
                return "bg-secondary";

            default:
                return "bg-secondary";
        }

    };

    return (

        <div className="glass-panel mt-4 p-0 overflow-hidden">

            <div className="dashboard-card-header">

                <div className="dashboard-card-title">

                    <h2 className="mb-0">Driver List</h2>

                </div>

            </div>

            <div className="table-responsive">

                <table className="table align-middle mb-0" style={{ color: "var(--text-primary)" }}>

                    <thead style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>

                        <tr>

                            <th>ID</th>

                            <th>Name</th>

                            <th>Email</th>

                            <th>Phone</th>

                            <th>License</th>

                            <th>Vehicle</th>

                            <th>Vehicle No.</th>

                            <th>Status</th>

                            <th width="180">

                                Actions

                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        {

                            drivers.length === 0

                                ?

                                (

                                    <tr>

                                        <td
                                            colSpan="9"
                                            className="text-center"
                                        >

                                            No Drivers Found

                                        </td>

                                    </tr>

                                )

                                :

                                drivers.map((driver) => (

                                    <tr key={driver.id}>

                                        <td>{driver.id}</td>

                                        <td>{driver.full_name}</td>

                                        <td>{driver.email}</td>

                                        <td>{driver.phone}</td>

                                        <td>{driver.license_number}</td>

                                        <td>{driver.vehicle_type}</td>

                                        <td>{driver.vehicle_number}</td>

                                        <td>

                                            <span
                                                className={`badge ${getStatusBadge(driver.status)}`}
                                            >

                                                {driver.status}

                                            </span>

                                        </td>

                                        <td>

                                            <button
                                                className="btn btn-info btn-sm me-2"
                                                onClick={() => onEdit(driver)}
                                            >
                                                Edit
                                            </button>

                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={() => {

                                                    if (
                                                        window.confirm(
                                                            "Delete this driver?"
                                                        )
                                                    ) {

                                                        onDelete(driver.id);

                                                    }

                                                }}
                                            >
                                                Delete
                                            </button>

                                        </td>

                                    </tr>

                                ))

                        }

                    </tbody>

                </table>

            </div>

        </div>

    );

}

export default DriverTable;