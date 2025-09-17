import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./Home.css";
import Header from "../../Components/Header";
import Footer from "../../Components/Footer";

const HomePage = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("http://localhost/fetchData.php")
      .then((response) => response.json())
      .then((data) => setData(data))
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  const sliderSettings = {
  dots: true,
  infinite: true,
  speed: 700,
  autoplay: true,
  autoplaySpeed: 2500,
  arrows: true,

  // Desktop defaults
  slidesToShow: 3,
  slidesToScroll: 1,
  centerMode: true,      // works best with odd slidesToShow
  centerPadding: "0px",

  responsive: [
    // <= 1280px: keep 3 centered
    { breakpoint: 1280, settings: { slidesToShow: 3, centerMode: true, centerPadding: "0px" } },
    // <= 1024px: 2, no center (prevents crowding/overlap)
    { breakpoint: 1024, settings: { slidesToShow: 2, centerMode: false } },
    // <= 768px: 1 centered
    { breakpoint: 768,  settings: { slidesToShow: 1, centerMode: true, centerPadding: "0px" } },
    // <= 480px: 1, no center (gives more room)
    { breakpoint: 480,  settings: { slidesToShow: 1, centerMode: false } },
  ],
};


  return (
    <div className="homepage" data-theme="dark">
      <Header />

      <div className="content">
        {data ? (
          <h2 className="stationTitle">
            Fuel Station ID: {data.station_id} | {data.location}
          </h2>
        ) : (
          <p className="stationPlaceholder" />
        )}

        <div className="carousel-container">
          <Slider {...sliderSettings}>
            <div className="slide-pad">
              <div className="slide-card">
                <img src="/station.jpg" alt="Fuel Station" loading="lazy" />
                <span className="scrim" />
              </div>
            </div>
            <div className="slide-pad">
              <div className="slide-card">
                <img src="/tanker.jpg" alt="Fuel Tanker" loading="lazy" />
                <span className="scrim" />
              </div>
            </div>
            <div className="slide-pad">
              <div className="slide-card">
                <img src="/fueling.jpg" alt="Fueling Car" loading="lazy" />
                <span className="scrim" />
              </div>
            </div>
          </Slider>
        </div>

        <div className="buttons">
          <Link to="/Daily%20Details"><button className="btn">Daily Records</button></Link>
          <Link to="/Payment"><button className="btn">Payment</button></Link>
          <Link to="/Browser%20Details"><button className="btn">Bowser Details</button></Link>
          <Link to="/IncomeExpenses"><button className="btn">Income & Expenses</button></Link>
          <Link to="/Summary"><button className="btn">Summary Records</button></Link>
          <Link to="/EmployeeProfile"><button className="btn">Employee Profile</button></Link>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default HomePage;
