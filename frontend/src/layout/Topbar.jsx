import {
    FaBell,
    FaSearch,
    FaUserCircle
} from "react-icons/fa";

import "./layout.css";

function Topbar() {

    return (

        <div className="topbar">

            <div className="search-box">

                <FaSearch />

                <input
                    type="text"
                    placeholder="Search parcels, drivers..."
                />

            </div>

            <div className="topbar-right">

                <FaBell className="top-icon" />

                <FaBell className="top-icon" />

                <div className="profile">

                    <FaUserCircle />

                    <span>Admin</span>

                </div>

            </div>

        </div>

    );

}

export default Topbar;