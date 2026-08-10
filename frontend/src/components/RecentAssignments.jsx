import {
  FaTruck,
  FaArrowRight,
  FaMapMarkerAlt,
} from "react-icons/fa";

import {
  normalizeStatus,
} from "../utils/dashboardUtils";

import "./RecentAssignments.css";

function RecentAssignments({
  assignments = [],
  drivers = [],
  parcels = [],
}) {

  const getDriver = (driverId) => {
    return drivers.find(
      (driver) => Number(driver.id) === Number(driverId)
    );
  };

  const getParcel = (parcelId) => {
    return parcels.find(
      (parcel) => Number(parcel.id) === Number(parcelId)
    );
  };

  const getInitial = (name) => {
    if (!name) return "?";
    return name.trim().charAt(0).toUpperCase();
  };

  return (
    <div className="dashboard-card recent-assignments-card">
      {/* Header */}
      <div className="dashboard-card-header">
        <div className="dashboard-card-title">
          <div className="dashboard-icon orange">
            <FaTruck />
          </div>
          <div>
            <span className="dashboard-overline">
              DELIVERY OPERATIONS
            </span>
            <h2>Recent Assignments</h2>
            <p>Assignments returned by your backend</p>
          </div>
        </div>

        <span className="dashboard-record-count">
          {assignments.length} records
        </span>
      </div>

      {assignments.length === 0 ? (
        <div className="dashboard-empty large">
          <FaTruck />
          <strong>No assignments found</strong>
          <span>Your backend returned no assignment records.</span>
        </div>
      ) : (
        <div className="recent-assignment-table">
          {/* Table Header */}
          <div className="recent-assignment-head">
            <span>ASSIGNMENT</span>
            <span>DRIVER</span>
            <span>ROUTE</span>
            <span style={{ textAlign: "right" }}>STATUS</span>
          </div>

          {/* Table Rows */}
          {assignments.slice(0, 8).map((assignment) => {
            const driver = getDriver(assignment.driver_id);
            const parcel = getParcel(assignment.parcel_id);

            const driverName =
              assignment.full_name ||
              driver?.full_name ||
              driver?.name ||
              (assignment.driver_id ? `Driver #${assignment.driver_id}' : "Driver Assigned');

            const vehicleNumber =
              assignment.vehicle_number ||
              driver?.vehicle_number ||
              driver?.vehicle_type ||
              "Vehicle Assigned";

            const pickup =
              assignment.pickup_address ||
              parcel?.pickup_address ||
              "—";

            const drop =
              assignment.drop_address ||
              parcel?.drop_address ||
              "—";

            const displayStatus =
              assignment.assignment_status ||
              assignment.status ||
              assignment.parcel_status ||
              "Assigned";

            const normalized = normalizeStatus(displayStatus);

            return (
              <div className="recent-assignment-row" key={assignment.id}>
                {/* Column 1: Assignment ID */}
                <div className="assignment-id-cell">
                  <div className="mini-truck-icon">
                    <FaTruck />
                  </div>
                  <strong>#{assignment.id}</strong>
                </div>

                {/* Column 2: Driver */}
                <div className="assignment-driver-cell">
                  <div className="assignment-avatar">
                    {getInitial(driverName)}
                  </div>
                  <div className="assignment-driver-info">
                    <strong>{driverName}</strong>
                    <span>{vehicleNumber}</span>
                  </div>
                </div>

                {/* Column 3: Route */}
                <div className="assignment-route-cell">
                  <span className="route-point pickup" title={pickup}>
                    {pickup}
                  </span>
                  <FaArrowRight className="route-arrow-icon" />
                  <span className="route-point drop" title={drop}>
                    {drop}
                  </span>
                </div>

                {/* Column 4: Status */}
                <div className="assignment-status-cell">
                  <span
                    className={`assignment-status-pill ${
                      normalized === "completed" || normalized === "delivered"
                        ? "delivered"
                        : normalized === "in_transit" || normalized === "assigned" || normalized === "active"
                        ? "transit"
                        : "pending"
                    }`}
                  >
                    <span className="status-dot" />
                    {displayStatus}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default RecentAssignments;