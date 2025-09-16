import React from 'react';
import './Datesection.css';

import { useState, useEffect } from 'react';
import {setYearDigits,yearDigits} from 'react';
import {setMonthDigits,monthDigits} from 'react';
import {setDayDigits,dayDigits} from 'react';


const Datesection= () => {
  const [yearDigits,setYearDigits] = useState([]);
  const [monthDigits,setMonthDigits] = useState([]);
  const [dayDigits,setDayDigits] = useState([]);

      // Function to update date dynamically

      //Year dynamically
  useEffect(() => {
    const currentYear = new Date().getFullYear().toString();
    setYearDigits(currentYear.split("")); // Split the year into individual digits
  }, []);
      

  //Month dynamically
  useEffect(() => {
      const currentMonth = (new Date().getMonth()+1).toString().padStart(2, "0"); // Ensure two digits
      setMonthDigits(currentMonth.split("")); // Split the Month into individual digits

  }, []);


  //Day dynamically
  useEffect(() => {
    const currentDay = new Date().getDate().toString().padStart(2, "0"); // Ensure two digits
    setDayDigits(currentDay.split("")); // Split the Month into individual digits

}, []);

      return (

    <div className="date-section">

      <div className='date-group'>
            <span>YEAR</span>
                <div className="year-boxes">
                 {yearDigits.map((digit, index) => (
                <div key={index} className="digit-box">
                  {digit}
                </div>
             ))}
        </div>
    </div>


<div className='date-group'>
        <span>MONTH</span>
                <div className="Month-boxes">
                 {monthDigits.map((digit, index) => (
                <div key={index} className="digit-box">
                  {digit}
                </div>
             ))}
        </div>
  </div>  

 
  <div className='date-group'>
        <span>DAY</span>
                <div className="Day-boxes">
                 {dayDigits.map((digit, index) => (
                <div key={index} className="digit-box">
                  {digit}
                </div>
             ))}
        
        </div>
    </div>
</div>
  );
  };
export default Datesection;