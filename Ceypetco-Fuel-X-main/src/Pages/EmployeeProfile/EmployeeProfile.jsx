import React from 'react';
import './EmployeeProfile.css';
import Footer from '../../Components/Footer';
import Header from '../../Components/Header';
import { useNavigate } from 'react-router-dom';

const EmployeeProfile = () => {
  const navigate = useNavigate();

  const staffMembers = [
    {
      employeeId: 'EMP001',
      employeeName: 'Thaveen Shamalka',
      jobRole: 'Fuel Pumper Operator'
    },
    {
      employeeId: 'EMP002',
      employeeName: 'Nimal Perera',
      jobRole: 'Cashier'
    },
    {
      employeeId: 'EMP003',
      employeeName: 'Kamal Silva',
      jobRole: 'Pump Technician'
    }
  ];

  return (
    <div className="profile-container">
      <Header />
      <div className="profile-content">
        <div className="staff-header">
          <h2>Staff Members</h2>
          <button className="register-btn" onClick={() => navigate('/StaffRegistration')}>
            + Register Staff
          </button>
        </div>

        <div className="staff-grid">
          {staffMembers.map((staff) => (
            <div key={staff.employeeId} className="staff-card">
              <h3>{staff.employeeName}</h3>
              <p><strong>ID:</strong> {staff.employeeId}</p>
              <p><strong>Role:</strong> {staff.jobRole}</p>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default EmployeeProfile;
