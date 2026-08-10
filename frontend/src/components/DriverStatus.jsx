import {
  FaTruck,
  FaEllipsisH,
} from "react-icons/fa";

import {
  normalizeStatus,
} from "../utils/dashboardUtils";

import "./DriverStatus.css";


function DriverStatus({
  drivers = [],
}) {

  const available =
    drivers.filter(
      (driver) =>
        normalizeStatus(
          driver.status
        ) === "available"
    );


  const busy =
    drivers.filter(
      (driver) =>
        normalizeStatus(
          driver.status
        ) !== "available"
    );


  const getInitial = (name) => {

    if (!name) {
      return "?";
    }

    return name
      .trim()
      .charAt(0)
      .toUpperCase();

  };


  return (

    <div className="dashboard-card driver-status-card">


      <div className="dashboard-card-header">

        <div className="dashboard-card-title">

          <div className="dashboard-icon green">
            <FaTruck />
          </div>

          <div>

            <span className="dashboard-overline">
              FLEET OPERATIONS
            </span>

            <h2>
              Driver Status
            </h2>

            <p>
              Current fleet availability
            </p>

          </div>

        </div>


        <button className="icon-button">
          <FaEllipsisH />
        </button>

      </div>


      {/* REAL SUMMARY */}

      <div className="driver-summary">

        <div className="driver-summary-item">

          <div className="driver-summary-icon available">
            <span />
          </div>

          <div>

            <strong>
              {available.length}
            </strong>

            <span>
              Available
            </span>

          </div>

        </div>


        <div className="driver-summary-item">

          <div className="driver-summary-icon delivery">

            <FaTruck />

          </div>

          <div>

            <strong>
              {busy.length}
            </strong>

            <span>
              Other Status
            </span>

          </div>

        </div>

      </div>


      {/* REAL DRIVER LIST */}

      <div className="driver-list">

        {drivers.length === 0 ? (

          <div className="dashboard-empty">

            <FaTruck />

            <strong>
              No drivers found
            </strong>

            <span>
              No driver records were returned
              by the backend.
            </span>

          </div>

        ) : (

          drivers.map(
            (driver) => {

              const status =
                normalizeStatus(
                  driver.status
                );


              const name =
                driver.full_name ||
                driver.name ||
                "Unnamed Driver";


              return (

                <div
                  className="driver-row"
                  key={driver.id}
                >

                  <div className="driver-avatar">
                    {getInitial(name)}
                  </div>


                  <div className="driver-info">

                    <strong>
                      {name}
                    </strong>

                    <span>

                      {driver.vehicle_type ||
                        "Vehicle not specified"}

                      {" • "}

                      {driver.vehicle_number ||
                        "Vehicle number unavailable"}

                    </span>

                  </div>


                  <div
                    className={
                      `driver-status ${
                        status === "available"
                          ? "available"
                          : "busy"
                      }`
                    }
                  >

                    <span />

                    {driver.status ||
                      "Unknown"}

                  </div>

                </div>

              );

            }
          )

        )}

      </div>

    </div>

  );

}


export default DriverStatus;