import {
  FaBoxOpen,
  FaArrowRight,
} from "react-icons/fa";

import {
  normalizeStatus,
} from "../utils/dashboardUtils";

import "./RecentParcels.css";


function RecentParcels({
  parcels = [],
}) {


  const recent =
    [...parcels]
      .sort(
        (a, b) =>
          new Date(
            b.created_at ||
            b.pickup_date ||
            0
          ) -
          new Date(
            a.created_at ||
            a.pickup_date ||
            0
          )
      )
      .slice(0, 8);


  const formatDate = (value) => {

    if (!value) {
      return "—";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "—";
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );

  };


  return (

    <div className="dashboard-card recent-parcels-card">


      <div className="dashboard-card-header">

        <div className="dashboard-card-title">

          <div className="dashboard-icon blue">
            <FaBoxOpen />
          </div>

          <div>

            <span className="dashboard-overline">
              SHIPMENT ACTIVITY
            </span>

            <h2>
              Recent Parcels
            </h2>

            <p>
              Latest shipments from your database
            </p>

          </div>

        </div>


        <span className="dashboard-record-count">
          {parcels.length} records
        </span>

      </div>


      {recent.length === 0 ? (

        <div className="dashboard-empty large">

          <FaBoxOpen />

          <strong>
            No parcels found
          </strong>

          <span>
            Your backend returned no parcel records.
          </span>

        </div>

      ) : (

        <div className="recent-parcel-table">


          <div className="recent-parcel-head">

            <span>
              PARCEL
            </span>

            <span>
              ROUTE
            </span>

            <span>
              TYPE
            </span>

            <span>
              STATUS
            </span>

            <span>
              DATE
            </span>

          </div>


          {recent.map(
            (parcel) => {

              const status =
                normalizeStatus(
                  parcel.status
                );


              return (

                <div
                  className="recent-parcel-row"
                  key={parcel.id}
                >

                  <div className="recent-shipment">

                    <div className="mini-box-icon">
                      <FaBoxOpen />
                    </div>

                    <strong>
                      #{parcel.id}
                    </strong>

                  </div>


                  <div className="recent-route">

                    <span>
                      {parcel.pickup_address ||
                        "—"}
                    </span>

                    <FaArrowRight />

                    <span>
                      {parcel.drop_address ||
                        "—"}
                    </span>

                  </div>


                  <div className="recent-customer">

                    {parcel.parcel_type ||
                      "—"}

                  </div>


                  <div>

                    <span
                      className={
                        `parcel-status-pill ${
                          status === "delivered"
                            ? "delivered"
                            : status === "pending"
                              ? "pending"
                              : "transit"
                        }`
                      }
                    >

                      <span />

                      {parcel.status ||
                        "Unknown"}

                    </span>

                  </div>


                  <div className="recent-date">

                    {formatDate(
                      parcel.created_at ||
                      parcel.pickup_date
                    )}

                  </div>

                </div>

              );

            }
          )}

        </div>

      )}

    </div>

  );

}


export default RecentParcels;