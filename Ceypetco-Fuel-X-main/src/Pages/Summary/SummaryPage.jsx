import React from 'react';
import './SummaryPage.css';
import Header from '../../Components/Header';
import Footer from '../../Components/Footer';
import { Link } from 'react-router-dom';

const SummaryPage = () => {
  return (
    <div className="summary">
      <Header />
      <div
        className="summary-container"
        style={{
          backgroundImage: `url(${process.env.PUBLIC_URL}/Summary.jpg)`,
        }}
      >
        <div className="overlay">
          <h1 className="title">Sri Lanka Ceypetco Fuel Station</h1>
          <div className="button-grid">
            <Link to="/BowserSummary"><button className="summary-btn">Bowser</button></Link>
            <Link to="/MonthlySummary"><button className="summary-btn">Monthly</button></Link>
            <Link to="/YearlySummary"><button className="summary-btn">Yearly</button></Link>
            <Link to="/SummaryDailyRecords"><button className="summary-btn">Daily</button></Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SummaryPage;