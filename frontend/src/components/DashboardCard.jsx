import "./dashboard.css";

function DashboardCard({

    title,
    value,
    subtitle,
    icon,
    color

}) {

    return (

        <div className="dashboard-card">

            <div
                className="card-icon"
                style={{
                    backgroundColor: color
                }}
            >

                {icon}

            </div>

            <h5 className="card-title">

                {title}

            </h5>

            <h1 className="card-value">

                {value}

            </h1>

            <p className="card-subtitle">

                {subtitle}

            </p>

        </div>

    );

}

export default DashboardCard;