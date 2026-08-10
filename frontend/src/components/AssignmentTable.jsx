import axios from "axios";

function AssignmentTable({ assignments, onRefresh }) {

    const completeDelivery = async (id) => {

        try {

            const token = localStorage.getItem("token");

            await axios.put(
                `${import.meta.env.VITE_API_URL}/api/assignments/${id}/complete`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            alert("Delivery Completed");

            if (onRefresh) {
                onRefresh();
            }

        } catch (error) {

            console.error(error);

            alert(
                error.response?.data?.message ||
                "Unable to complete delivery."
            );

        }

    };

    return (

        <div className="card shadow">

            <div className="card-header bg-primary text-white">

                <h4 className="mb-0">

                    Assignment List

                </h4>

            </div>

            <div className="card-body">

                <div className="table-responsive">

                    <table className="table table-bordered table-hover">

                        <thead className="table-dark">

                            <tr>

                                <th>ID</th>

                                <th>Parcel</th>

                                <th>Driver</th>

                                <th>Vehicle</th>

                                <th>Status</th>

                                <th>Assigned At</th>

                                <th>Action</th>

                            </tr>

                        </thead>

                        <tbody>

                            {assignments.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan="7"
                                        className="text-center"
                                    >

                                        No Assignments Found

                                    </td>

                                </tr>

                            ) : (

                                assignments.map((assignment) => (

                                    <tr key={assignment.id}>

                                        <td>

                                            {assignment.id}

                                        </td>

                                        <td>

                                            #{assignment.parcel_id}

                                            <br />

                                            <small>

                                                {assignment.pickup_address}

                                                {" → "}

                                                {assignment.drop_address}

                                            </small>

                                        </td>

                                        <td>

                                            {assignment.full_name}

                                        </td>

                                        <td>

                                            {assignment.vehicle_number}

                                        </td>

                                        <td>

                                            <span
                                                className={
                                                    assignment.assignment_status === "Completed"
                                                        ? "badge bg-success"
                                                        : "badge bg-warning text-dark"
                                                }
                                            >

                                                {assignment.assignment_status}

                                            </span>

                                        </td>

                                        <td>

                                            {assignment.assigned_at
                                                ? new Date(
                                                      assignment.assigned_at
                                                  ).toLocaleString()
                                                : "-"}

                                        </td>

                                        <td>

                                            {assignment.assignment_status !==
                                                "Completed" && (

                                                <button
                                                    className="btn btn-success btn-sm"
                                                    onClick={() =>
                                                        completeDelivery(
                                                            assignment.id
                                                        )
                                                    }
                                                >

                                                    Complete

                                                </button>

                                            )}

                                        </td>

                                    </tr>

                                ))

                            )}

                        </tbody>

                    </table>

                </div>

            </div>

        </div>

    );

}

export default AssignmentTable;