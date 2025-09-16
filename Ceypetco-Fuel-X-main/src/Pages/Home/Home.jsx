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
    speed: 1000,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2000,
    arrows: true,
    centerMode: true,
    centerPadding: "0px",
  };

  return (
    <div className="homepage">
      <Header />
      <div className="content">
        {data ? (
          <h2>Fuel Station ID: {data.station_id} | {data.location}</h2>
        ) : (
          <p></p>
        )}

        <div className="carousel-container">
          <Slider {...sliderSettings}>
            <div><img src="/station.jpg" alt="Fuel Station" loading="lazy" /></div>
            <div><img src="/tanker.jpg" alt="Fuel Tanker" loading="lazy" /></div>
            <div><img src="/fueling.jpg" alt="Fueling Car" loading="lazy" /></div>
          </Slider>
        </div>

        <div className="buttons">
          <Link to="/Daily%20Details"><button className="btn">Daily Records</button></Link><br></br>
          <Link to="/Payment"><button className="btn">Payment</button></Link><br></br>
          <Link to="/Browser%20Details"><button className="btn">Bowser Details</button></Link><br></br>
          <Link to="/IncomeExpenses"><button className="btn">Income & Expenses</button></Link><br></br>
          <Link to="/Summary"><button className="btn">Summary Records</button></Link><br></br>
          <Link to="/EmployeeProfile"><button className="btn">Employee Profile</button></Link><br></br>
          
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default HomePage;