import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Body.css';
import Header from '../../Components/Header';
import Footer from '../../Components/Footer';

// const dailyDetailsImage = '/dailydetails.jpg'; // if you want to use an import, keep in /public

const FUEL_TYPES = [
  'Lanka Petrol 92 Octane',
  'Lanka Petrol 95 Octane',
  'Lanka Auto Diesel',
  'Lanka Super Diesel',
];

const ROUTES = {
  'Lanka Petrol 92 Octane': '/Petrol92',
  'Lanka Petrol 95 Octane': '/Petrol95',
  'Lanka Auto Diesel': '/Diesel',
  'Lanka Super Diesel': '/SuperDiesel',
};

const COLORS = {
  'Lanka Petrol 92 Octane': '#0ea5e9',
  'Lanka Petrol 95 Octane': '#f43f5e',
  'Lanka Auto Diesel': '#22c55e',
  'Lanka Super Diesel': '#f59e0b',
};

const Body = () => {
  const [yearDigits, setYearDigits] = useState([]);
  const [monthDigits, setMonthDigits] = useState([]);
  const [dayDigits, setDayDigits] = useState([]);
  const [loading, setLoading] = useState(true);

  const [fuelStock, setFuelStock] = useState({
    'Lanka Petrol 92 Octane': 0,
    'Lanka Petrol 95 Octane': 0,
    'Lanka Auto Diesel': 0,
    'Lanka Super Diesel': 0,
  });

  useEffect(() => {
    const fetchFuelStock = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/scanned-text/latest-by-fuel');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const stockMap = {
          'Lanka Petrol 92 Octane': 0,
          'Lanka Petrol 95 Octane': 0,
          'Lanka Auto Diesel': 0,
          'Lanka Super Diesel': 0,
        };

        (data || []).forEach(item => {
          if (stockMap[item.fuelType] !== undefined) {
            const n = Number(item.scannedText);
            stockMap[item.fuelType] = Number.isFinite(n) ? n : 0;
          }
        });

        setFuelStock(stockMap);
      } catch (err) {
        console.error('Error fetching fuel stock:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFuelStock();
  }, []);

  useEffect(() => {
    const now = new Date();
    const y = now.getFullYear().toString();
    setYearDigits(y.split(''));
    const m = (now.getMonth() + 1).toString().padStart(2, '0');
    setMonthDigits(m.split(''));
    const d = now.getDate().toString().padStart(2, '0');
    setDayDigits(d.split(''));
  }, []);

  const fmt = n => Number(n || 0).toLocaleString();

  return (
    <div className="body" data-theme="dark">
      <Header />

      <div className="Container">
        <h1 className="page-title">Daily Records</h1>

        {/* Image */}
        <div className="daily-image-container">
          {/* <img src={dailyDetailsImage} alt="Daily Details" className="daily-image" /> */}
          <img
            src="/dailydetails.jpg"
            alt="Daily details cover"
            loading="lazy"
            className="daily-image"
            onError={e => { e.currentTarget.style.display = 'none'; }}
          />
        </div>

        {/* Fuel cards */}
        <div className="fuel-cards">
          {FUEL_TYPES.map(ft => (
            <Link
              key={ft}
              to={ROUTES[ft]}
              className="fuel-card"
              title={`Open ${ft}`}
            >
              <div className="fuel-card-top">
                <span className="fuel-chip" style={{ backgroundColor: COLORS[ft] }} />
                <span className="fuel-name">{ft}</span>
              </div>

              <div className="fuel-card-bottom">
                <div className="liters" aria-live="polite">
                  {loading ? (
                    'Loading…'
                  ) : (
                    <>
                      <strong>{fmt(fuelStock[ft])}</strong> <span>Liters</span>
                    </>
                  )}
                </div>
                <div className="cta">Open →</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Date */}
        <div className="date-section">
          <div className="date-group">
            <span>YEAR</span>
            <div className="year-boxes">
              {yearDigits.map((digit, index) => (
                <div key={index} className="digit-box">{digit}</div>
              ))}
            </div>
          </div>

          <div className="date-group">
            <span>MONTH</span>
            <div className="Month-boxes">
              {monthDigits.map((digit, index) => (
                <div key={index} className="digit-box">{digit}</div>
              ))}
            </div>
          </div>

          <div className="date-group">
            <span>DAY</span>
            <div className="Day-boxes">
              {dayDigits.map((digit, index) => (
                <div key={index} className="digit-box">{digit}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Body;
