import React from "react";
import "./Header.css"; // Import the CSS file for styling
import { Link } from 'react-router-dom';


const Header = () => {
  return (
    <nav className="navbar">
        <div className="logo">
        <img src="ceypetco_logo.png" alt="Fuel Station Logo"/>
        </div>
      
     <ul className="nav-links">
          <li><Link to="/home">Home</Link></li>
          <li><Link to="/IncomeExpenses">Income & Expenses</Link></li>
          <li><Link to="/Payment">Payment</Link></li>
          <li><Link to="/Daily Details">Daily Details</Link></li>
          <li><Link to="/Browser Details">Bowser Details</Link></li>
          <li><Link to="/Summary">Summary</Link></li>
          <li><Link to="/StaffRegistration">Staff Registration</Link></li>
          <li><Link to="/Login">Logout</Link></li>

      
      </ul>
    </nav>
    
  );
};

export default Header;
