import React from 'react';
import './Footer.css';
import { FaFacebookF, FaTwitter, FaLinkedinIn, FaInstagram } from 'react-icons/fa';

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
            <li><a href="/home">Home</a></li>
            <li><a href="/dashboard">Dashboard</a></li>
            <li><a href="/summary">Summary</a></li>
            <li><a href="/contact">Contact Us</a></li>
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
