import {
  FaChartLine,
  FaDatabase,
} from "react-icons/fa";

import "./DeliveryPerformance.css";


function DeliveryPerformance({
  data = [],
}) {

  const totalDelivered =
    data.reduce(
      (total, item) =>
        total +
        Number(
          item.delivered || 0
        ),
      0
    );


  const maxValue =
    data.length > 0
      ? Math.max(
          ...data.map(
            (item) =>
              Number(
                item.delivered || 0
              )
          )
        )
      : 0;


  return (

    <div className="dashboard-card delivery-performance-card">


      <div className="dashboard-card-header">

        <div className="dashboard-card-title">

          <div className="dashboard-icon blue">

            <FaChartLine />

          </div>

          <div>

            <span className="dashboard-overline">
              REAL DELIVERY DATA
            </span>

            <h2>
              Delivery Performance
            </h2>

            <p>
              Actual delivered parcels
            </p>

          </div>

        </div>

      </div>


      <div className="delivery-total">

        <span>
          Delivered in last 7 days
        </span>

        <strong>
          {totalDelivered}
        </strong>

      </div>


      {data.length === 0 ? (

        <div className="delivery-no-data">

          <FaDatabase />

          <strong>
            No delivery activity
          </strong>

          <span>
            No delivered parcels were
            recorded in the last 7 days.
          </span>

        </div>

      ) : (

        <div className="delivery-chart">

          <div className="delivery-bars">

            {data.map(
              (item) => {

                const value =
                  Number(
                    item.delivered || 0
                  );


                const height =
                  maxValue > 0
                    ? (
                        value /
                        maxValue
                      ) * 100
                    : 0;


                return (

                  <div
                    className="delivery-bar-column"
                    key={item.date}
                  >

                    <span className="delivery-bar-value">
                      {value}
                    </span>


                    <div className="delivery-bar-area">

                      <div
                        className="delivery-bar"
                        style={{
                          height:
                            `${height}%`,
                        }}
                      />

                    </div>


                    <span className="delivery-bar-label">
                      {item.label}
                    </span>

                  </div>

                );

              }
            )}

          </div>

        </div>

      )}

    </div>

  );

}


export default DeliveryPerformance;