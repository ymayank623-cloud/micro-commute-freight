import { Link, useNavigate } from "react-router-dom";

function Navbar() {

    const navigate = useNavigate();

    const logout = () => {

        localStorage.removeItem("token");

        navigate("/login");

        window.location.reload();

    };

    return (

        <nav className="navbar navbar-expand-lg navbar-dark bg-dark">

            <div className="container-fluid">

                <Link
                    className="navbar-brand fw-bold"
                    to="/dashboard"
                >
                    🚚 FlowLink
                </Link>

                <button
                    className="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarNav"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div
                    className="collapse navbar-collapse"
                    id="navbarNav"
                >

                    <ul className="navbar-nav me-auto">

                        <li className="nav-item">

                            <Link
                                className="nav-link"
                                to="/dashboard"
                            >
                                Dashboard
                            </Link>

                        </li>

                        <li className="nav-item">

                            <Link
                                className="nav-link"
                                to="/parcels"
                            >
                                Parcels
                            </Link>

                        </li>

                        <li className="nav-item">

                            <Link
                                className="nav-link"
                                to="/drivers"
                            >
                                Drivers
                            </Link>

                        </li>

                        <li className="nav-item">

                            <Link
                                className="nav-link"
                                to="/assignments"
                            >
                                Assignments
                            </Link>

                        </li>

                        <li className="nav-item">

                            <Link
                                className="nav-link"
                                to="/tracking"
                            >
                                Tracking
                            </Link>

                        </li>

                        <li className="nav-item">

                            <Link
                                className="nav-link"
                                to="/analytics"
                            >
                                Analytics
                            </Link>

                        </li>

                    </ul>

                    <button
                        className="btn btn-danger"
                        onClick={logout}
                    >
                        Logout
                    </button>

                </div>

            </div>

        </nav>

    );

}

export default Navbar;