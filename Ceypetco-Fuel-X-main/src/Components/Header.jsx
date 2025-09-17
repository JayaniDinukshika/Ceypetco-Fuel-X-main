import React from "react";
import "./Header.css";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <nav className="navbar" data-theme="dark">
      {/* inline style here guarantees left/right alignment */}
      <div
        className="nav-inner"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}
      >
        <div className="logo" style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
          <img src="/ceypetco_logo.png" alt="Fuel Station Logo" />
          <span className="brand">Ceypetco Fuel:X</span>
        </div>

        <ul className="nav-links">
          <li><Link to="/home">Home</Link></li>
          <li><Link to="/IncomeExpenses">Income & Expenses</Link></li>
          <li><Link to="/Payment">Payment</Link></li>
          <li><Link to="/Daily%20Details">Daily Details</Link></li>
          <li><Link to="/Browser%20Details">Bowser Details</Link></li>
          <li><Link to="/BowserSummary">Summary</Link></li>
          <li><Link to="/StaffRegistration">Staff Registration</Link></li>
          <li><Link to="/Login">Logout</Link></li>
        </ul>
      </div>
    </nav>
  );
};

export default Header;
