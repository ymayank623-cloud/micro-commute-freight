import {
  FaBoxOpen,
  FaUserPlus,
  FaCity,
  FaMapMarkerAlt,
  FaArrowRight,
  FaSlidersH,
} from "react-icons/fa";

import { useNavigate } from "react-router-dom";
import { useState } from "react";

import "./QuickActions.css";


function QuickActions() {
  const navigate = useNavigate();

  const actions = [

    {
      title: "Create Shipment",
      description: "Create a new parcel",
      icon: <FaBoxOpen />,
      color: "blue",
      path: "/parcels",
    },

    {
      title: "Dispatch & Matching Rules",
      description: "Dual driver & pricing policy",
      icon: <FaSlidersH />,
      color: "green",
      path: "/dispatch-rules",
    },

    {
      title: "City Managers",
      description: "Regional Operations Leads",
      icon: <FaCity />,
      color: "orange",
      path: "/city-managers",
    },

    {
      title: "Track Shipment",
      description: "Track an existing parcel",
      icon: <FaMapMarkerAlt />,
      color: "purple",
      path: "/tracking",
    },

  ];


  return (
    <>
    <section className="quick-actions-card">

      {/* HEADER */}

      <div className="quick-actions-header">

        <span className="quick-actions-label">
          OPERATIONS
        </span>

        <h2>
          Quick Actions
        </h2>

        <p>
          Common logistics tasks
        </p>

      </div>


      {/* ACTIONS */}

      <div className="quick-actions-grid">

        {actions.map((action) => (

          <button
            type="button"

            key={action.title}

            className={
              `quick-action-item ${action.color}`
            }

            onClick={() => {
              if (action.title === "Assign Delivery") {
                setShowAssignModal(true);
              } else {
                navigate(action.path);
              }
            }}
          >

            {/* ICON + ARROW */}

            <div className="quick-action-top">

              <div className="quick-action-icon">
                {action.icon}
              </div>

              <div className="quick-action-arrow">
                <FaArrowRight />
              </div>

            </div>


            {/* TEXT */}

            <div className="quick-action-content">

              <strong>
                {action.title}
              </strong>

              <span>
                {action.description}
              </span>

            </div>

          </button>

        ))}

      </div>

    </section>
    </>
  );

}


export default QuickActions;