import React, { useState } from 'react';
import './Petrol92Octane.css';
import SummaryDailyRecords from '../SummaryDailyRecords/SummaryDailyRecords';

const Petrol92Octane = () => {
  const [showSummary, setShowSummary] = useState(false);

  if (showSummary) {
    return <SummaryDailyRecords onClose={() => setShowSummary(false)} />;
  }

  return (
    <div className="petrol92-container">
      <div className="petrol92-title-bar">
        <span>Lanka Petrol 92 Octane</span>
        <button className="close-btn">x</button>
      </div>
      <div className="pump-section">
        <div className="pump-box">
          <div className="pump-header">Pump 1</div>
          <div className="pump-content">
            <div className="pump-row">
              <span>Day</span>
              <span className="pump-day">--/--/----</span>
              <span className="pump-icon" />
            </div>
            <div className="pump-row">
              <span className="pump-label">Last Reading</span>
              <span className="pump-bar bold">2000ℓ</span>
            </div>
            <div className="pump-row">
              <span className="pump-label">Today Reading</span>
              <span className="pump-bar" />
            </div>
            <div className="pump-row">
              <span className="pump-label">Sale</span>
              <span className="pump-bar" />
            </div>
          </div>
        </div>
        <div className="pump-box">
          <div className="pump-header">Pump 2</div>
          <div className="pump-content">
            <div className="pump-row">
              <span>Day</span>
              <span className="pump-day">--/--/----</span>
              <span className="pump-icon" />
            </div>
            <div className="pump-row">
              <span className="pump-label">Last Reading</span>
              <span className="pump-bar bold">3000ℓ</span>
            </div>
            <div className="pump-row">
              <span className="pump-label">Today Reading</span>
              <span className="pump-bar" />
            </div>
            <div className="pump-row">
              <span className="pump-label">Sale</span>
              <span className="pump-bar" />
            </div>
          </div>
        </div>
      </div>
      <div className="petrol92-total-row">
        <span className="petrol92-total-label">Total</span>
        <span className="petrol92-total-value">2500ℓ</span>
      </div>
      <button className="summary-btn" onClick={() => setShowSummary(true)}>
        Show Summary Daily Records
      </button>
    </div>
  );
};

export default Petrol92Octane; 