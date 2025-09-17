import React from 'react';
import './Footer.css';
import { FaFacebookF, FaTwitter, FaLinkedinIn, FaInstagram } from 'react-icons/fa';
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="footer" data-theme="dark">
      <div className="footer-container">

        <div className="footer-section brand">
          <h2>Ceypetco Fuel:X</h2>
          <p>Empowering smart fuel logistics and station control across Sri Lanka.</p>
        </div>

        <div className="footer-section links">
          <h3>Quick Links</h3>
          <ul>
            <li><Link to="/home">Home</Link></li>
            <li><Link to="/Daily Details">Daily Details</Link></li>
            <li><Link to="/Browser Details">Bowser Details</Link></li>
            <li><Link to="/BowserSummary">Summary</Link></li>
          </ul>
        </div>

        <div className="footer-section contact">
          <h3>Contact</h3>
          <p>Email: support@ceypetco.lk</p>
          <p>Phone: +94 762826977</p>
          
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} Ceypetco Fuel:X. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
