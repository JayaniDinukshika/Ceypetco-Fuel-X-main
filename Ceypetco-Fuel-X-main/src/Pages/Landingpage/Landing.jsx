// src/Pages/Landing.jsx
import React from "react";
import { Link } from "react-router-dom";
import "./Landing.css";

const Landing = () => {
  const year = new Date().getFullYear();

  return (
    <div className="landing" data-theme="dark">
      <div className="landing__wrap">
        <section className="hero">
          <div className="hero__content">
            <p className="eyebrow">Ceypetco Fuel:X</p>
            <h1 className="hero__title">Smart Fuel Management System</h1>
            <p className="hero__subtitle">
              Monitor fuel distribution, manage stations, and optimize logistics —
              all in one centralized platform built for performance and control.
            </p>

            <div className="cta">
              <Link to="/login" className="btn btn--primary">
                Login
              </Link>
              {/* If you add a demo later: */}
              {/* <Link to="/demo" className="btn btn--ghost">Live Demo</Link> */}
            </div>
          </div>

          <div className="hero__media">
            <div className="mediaCard">
              <img
                src="fueling.jpg"
                alt="Fuel station and bowser monitoring interface"
                className="mediaCard__img"
                onError={(e) => {
                  // hide image gracefully if not found
                  e.currentTarget.style.display = "none";
                  e.currentTarget.parentElement.classList.add("mediaCard--fallback");
                }}
              />
              <div className="mediaCard__glow" aria-hidden="true" />
            </div>
          </div>
        </section>
      </div>

      <footer className="landing__footer">
        <p>© {year} Ceypetco Fuel:X. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Landing;
