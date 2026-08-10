import { useState } from "react";

function ParcelTable({
    parcels,
    onEdit,
    onDelete,
    onStatusUpdate
}) {

    const [status, setStatus] = useState({});

    const getBadgeColor = (currentStatus) => {

        switch (currentStatus) {

            case "Pending":
                return "bg-warning text-dark";

            case "Assigned":
                return "bg-info";

            case "In Transit":
                return "bg-primary";

            case "Delivered":
                return "bg-success";

            default:
                return "bg-secondary";

        }

    };

    return (

        <div className="card shadow mt-4">

            <div className="card-header bg-dark text-white">

                <h4 className="mb-0">

                    All Parcels

                </h4>

            </div>

            <div className="table-responsive">

                <table className="table table-bordered table-hover align-middle mb-0">

                    <thead className="table-primary">

                        <tr>

                            <th>ID</th>

                            <th>Pickup Address</th>

                            <th>Drop Address</th>

                            <th>Weight</th>

                            <th>Parcel Type</th>

                            <th>Pickup Date</th>

                            <th>Status</th>

                            <th width="320">

                                Actions

                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        {

                            parcels.length === 0

                                ?

                                (

                                    <tr>

                                        <td
                                            colSpan="8"
                                            className="text-center"
                                        >

                                            No Parcels Found

                                        </td>

                                    </tr>

                                )

                                :

                                parcels.map((parcel) => (

                                    <tr key={parcel.id}>

                                        <td>

                                            {parcel.id}

                                        </td>

                                        <td>

                                            {parcel.pickup_address}

                                        </td>

                                        <td>

                                            {parcel.drop_address}

                                        </td>

                                        <td>

                                            {parcel.weight} kg

                                        </td>

                                        <td>

                                            {parcel.parcel_type}

                                        </td>

                                        <td>

                                            {

                                                parcel.pickup_date

                                                    ?

                                                    parcel.pickup_date.substring(0, 10)

                                                    :

                                                    "-"

                                            }

                                        </td>

                                        <td>

                                            <span
                                                className={`badge ${getBadgeColor(parcel.status)}`}
                                            >

                                                {parcel.status}

                                            </span>

                                        </td>

                                        <td>

                                            <div className="d-flex flex-wrap gap-2">

                                                <button
                                                    className="btn btn-info btn-sm"
                                                    onClick={() =>
                                                        onEdit(parcel)
                                                    }
                                                >

                                                    Edit

                                                </button>

                                                <select
                                                    className="form-select form-select-sm"
                                                    style={{ width: "130px" }}
                                                    value={
                                                        status[parcel.id] ||
                                                        parcel.status
                                                    }
                                                    onChange={(e) =>
                                                        setStatus({
                                                            ...status,
                                                            [parcel.id]:
                                                                e.target.value,
                                                        })
                                                    }
                                                >

                                                    <option value="Pending">

                                                        Pending

                                                    </option>

                                                    <option value="Assigned">

                                                        Assigned

                                                    </option>

                                                    <option value="In Transit">

                                                        In Transit

                                                    </option>

                                                    <option value="Delivered">

                                                        Delivered

                                                    </option>

                                                </select>

                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    onClick={() =>
                                                        onStatusUpdate(
                                                            parcel.id,
                                                            status[parcel.id] ||
                                                            parcel.status
                                                        )
                                                    }
                                                >

                                                    Update

                                                </button>

                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => {

                                                        if (
                                                            window.confirm(
                                                                "Delete this parcel?"
                                                            )
                                                        ) {

                                                            onDelete(parcel.id);

                                                        }

                                                    }}
                                                >

                                                    Delete

                                                </button>

                                            </div>

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

export default ParcelTable;