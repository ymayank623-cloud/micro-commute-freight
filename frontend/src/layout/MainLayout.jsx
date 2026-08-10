import { useState } from "react";

import Sidebar from "./Sidebar";
import TopNavbar from "../components/TopNavbar";

import "./layout.css";

function MainLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-layout">

      <Sidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <main className="main-area">

        <TopNavbar
          onMenuClick={() => setMobileOpen(true)}
        />

        <div className="page-content">
          {children}
        </div>

      </main>

    </div>
  );
}

export default MainLayout;