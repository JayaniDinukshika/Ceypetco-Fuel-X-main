// src/Pages/Landing.jsx
import React from "react";
import { Link } from "react-router-dom";
import "./Landing.css";

const Landing = () => {
  return (
    <div className="landing-container">
      <div className="hero">
        <div className="hero-text">
          <h1>Smart Fuel Management System</h1>
          <h2>Ceypetco Fuel:X</h2>
          <p>
            Monitor fuel distribution, manage stations, and optimize logistics —
            all in one centralized platform built for performance and control.
          </p>
          <div className="cta-buttons">
            
            <div className="auth-buttons">
              <Link to="/login" className="btn login-btn">Login</Link>
              
            </div>
          </div>
        </div>
        <div className="hero-image">
          <img src="fueling.jpg" alt="Fuel management illustration" />
        </div>
      </div>

      <footer className="landing-footer">
        <p>&copy; {new Date().getFullYear()} Ceypetco Fuel:X. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Landing;
