import React, { useState } from 'react';
import  './Fuelstock.css';

const Fuelstock = () => {
   
    //manage fuel stock
    const [fuelstock,setFuelstock] =useState ({
        LankaPetrol92Octane: "",
        LankaPetrol95Octane:"",
        LankaAutoDiesel:"",
        LankaSuperDiesel:"",

    });

    //Track submission
    const [submitted,setSubmitted]=useState (false)

    const handleChange =(e) => {
        setFuelstock({...fuelstock,[e.target.name]:e.target.value});
    };

    const handlSubmit = (e) => {
        e.preventDefault();
        setSubmitted(true);
        console.log ("SEND",fuelstock);
    };

    return (
        <div className='fuel-stock'>
            <h2>Today Fuel Stock</h2>
            
        <div className='box'>
            <form onSubmit={handlSubmit} className='fuel-form'>

                
                <div className='fuel-input'>
                    <label>Lanka Petrol 92 Octane (Liters) </label>
                    <input
                       type='number'
                       name='Lanka Petrol 92 Octane'
                       value={fuelstock.LankaPetrol92Octane}
                       onChange={handleChange}
                       required
                       />
                </div>

                <div className='fuel-input'>
                    <label>Lanka Petrol 95 Octane (Liters) </label>
                    <input
                       type='number'
                       name='Lanka Petrol 95 Octane'
                       value={fuelstock.LankaPetrol95Octane}
                       onChange={handleChange}
                       required
                       />
                </div>

            
                <div className='fuel-input'>
                    <label> Lanka Auto Diesel (Liters) </label>
                    <input
                       type='number'
                       name='Lanka Auto Diesel'
                       value={fuelstock.LankaAutoDiesel}
                       onChange={handleChange}
                       required
                       />

                </div>

               
                <div className='fuel-input'>
                    <label> Lanka Super Diesel (Liters) </label>
                    <input
                       type='number'
                       name='Lanka Super Diesel'
                       value={fuelstock.LankaSuperDiesel}
                       onChange={handleChange}
                       required
                       />
                </div>

            
            <button type="button" className='submit-btn'>
                SEND
            </button>
            </form>
            </div>
</div>
       
  );
};

export default Fuelstock;
      