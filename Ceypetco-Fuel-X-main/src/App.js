import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { AuthProvider } from './auth/AuthContext';
import RequireAuth from './routes/RequireAuth';
import RequireRole from './routes/RequireRole';
import { ROLES } from './constants/roles';

import Landing from './Pages/Landingpage/Landing';
import Login from './Pages/Login/Login';
import Register from './Pages/Signup/Register';
import Home from './Pages/Home/Home';
import DailyDetails from './Pages/DailyDetails/DailyDetails';
import Browserdetails from './Pages/Browserdetails/Browserdetails';
import SummaryPage from './Pages/Summary/SummaryPage';
import Payment from './Pages/Payment/Payment';
import SummaryDailyRecords from './Pages/SummaryDailyRecords/SummaryDailyRecords';
import IncomeExpenses from './Pages/IncomeExpenses/IncomeExpenses';
import Petrol92 from './Pages/Fueltypes/Petrol92';
import Petrol95 from './Pages/Fueltypes/Petrol95';
import SuperDiesel from './Pages/Fueltypes/SuperDiesel';
import Diesel from './Pages/Fueltypes/Diesel';
import Petrol92Octane from './Pages/Fueltypes/Petrol92Octane';
import EmployeeProfile from './Pages/EmployeeProfile/EmployeeProfile';
import MonthlySummary from './Pages/SummaryDailyRecords/MonthlySummary';
import YearlySummary from './Pages/SummaryDailyRecords/YearlySummary';
import BowserSummary from './Pages/SummaryDailyRecords/BowserSummary';
import StaffRegistration from './Pages/StaffRegistration/StaffRegistration';
import NotAuthorized from './Pages/NotAuthorized/NotAuthorized';
//import AttendanceManager from './Pages/Attendance/AttendanceManager';
import AttendanceManager from './Pages/Attendance/AttendanceManager';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/Login" element={<Login />} />
          <Route path="/not-authorized" element={<NotAuthorized />} />

          {/* SUPER ADMIN */}
          <Route
            path="/Home"
            element={
              <RequireAuth>
                <RequireRole allowed={[ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT, ROLES.HEAD_OFFICER, ROLES.AREA_MANAGER]}>
                  <Home />
                </RequireRole>
              </RequireAuth>
            }
          />
          <Route
            path="/register"
            element={
              <RequireAuth>
                <RequireRole allowed={[ROLES.SUPER_ADMIN, ROLES.MANAGER]}>
                  <Register />
                </RequireRole>
              </RequireAuth>
            }
          />
          <Route
            path="/Daily Details"
            element={
              <RequireAuth>
                <RequireRole allowed={[ROLES.SUPER_ADMIN, ROLES.MANAGER]}>
                  <DailyDetails />
                </RequireRole>
              </RequireAuth>
            }
          />
          <Route
            path="/Browser Details"
            element={
              <RequireAuth>
                <RequireRole allowed={[ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.HEAD_OFFICER, ROLES.AREA_MANAGER]}>
                  <Browserdetails />
                </RequireRole>
              </RequireAuth>
            }
          />
          <Route
            path="/Summary"
            element={
              <RequireAuth>
                <RequireRole allowed={[ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT, ROLES.HEAD_OFFICER, ROLES.AREA_MANAGER]}>
                  <SummaryPage />
                </RequireRole>
              </RequireAuth>
            }
          />
          <Route
            path="/Payment"
            element={
              <RequireAuth>
                <RequireRole allowed={[ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT]}>
                  <Payment />
                </RequireRole>
              </RequireAuth>
            }
          />
          {/* <Route
            path="/AttendanceManager"
            element={
              <RequireAuth>
                <RequireRole allowed={[ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT]}>
                  <AttendanceManager />
                </RequireRole>
              </RequireAuth>
            }
          /> */}
          {/* <Route
            path="/SummaryDailyRecords"
            element={
              <RequireAuth>
                <RequireRole allowed={[ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT, ROLES.HEAD_OFFICER, ROLES.AREA_MANAGER]}>
                  <SummaryDailyRecords />
                </RequireRole>
              </RequireAuth>
            }
          /> */}
          <Route
            path="/IncomeExpenses"
            element={
              <RequireAuth>
                <RequireRole allowed={[ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT]}>
                  <IncomeExpenses />
                </RequireRole>
              </RequireAuth>
            }
          />

          {/* Fuel types — SA / Manager / Accountant */}
          <Route
            path="/Petrol92"
            element={
              <RequireAuth>
                <RequireRole allowed={[ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT]}>
                  <Petrol92 />
                </RequireRole>
              </RequireAuth>
            }
          />
          <Route
            path="/Petrol95"
            element={
              <RequireAuth>
                <RequireRole allowed={[ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT]}>
                  <Petrol95 />
                </RequireRole>
              </RequireAuth>
            }
          />
          <Route
            path="/SuperDiesel"
            element={
              <RequireAuth>
                <RequireRole allowed={[ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT]}>
                  <SuperDiesel />
                </RequireRole>
              </RequireAuth>
            }
          />
          <Route
            path="/Diesel"
            element={
              <RequireAuth>
                <RequireRole allowed={[ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT]}>
                  <Diesel />
                </RequireRole>
              </RequireAuth>
            }
          />
          <Route
            path="/Petrol92Octane"
            element={
              <RequireAuth>
                <RequireRole allowed={[ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT]}>
                  <Petrol92Octane />
                </RequireRole>
              </RequireAuth>
            }
          />

          {/* Shared
          <Route
            path="/EmployeeProfile"
            element={
              <RequireAuth>
                <RequireRole allowed={[ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT]}>
                  <EmployeeProfile />
                </RequireRole>
              </RequireAuth>
            }
          />
          <Route
            path="/MonthlySummary"
            element={
              <RequireAuth>
                <RequireRole allowed={[ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT]}>
                  <MonthlySummary />
                </RequireRole>
              </RequireAuth>
            }
          />
          <Route
            path="/YearlySummary"
            element={
              <RequireAuth>
                <RequireRole allowed={[ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT]}>
                  <YearlySummary />
                </RequireRole>
              </RequireAuth>
            }
          /> */}
          <Route
            path="/BowserSummary"
            element={
              <RequireAuth>
                <RequireRole allowed={[ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT, ROLES.HEAD_OFFICER, ROLES.AREA_MANAGER]}>
                  <BowserSummary />
                </RequireRole>
              </RequireAuth>
            }
          />
          {/* <Route
            path="/AttendanceManager"
            element={
              <RequireAuth>
                <RequireRole allowed={[ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT]}>
                  <AttendanceManager />
                </RequireRole>
              </RequireAuth>
            }
          /> */}
          

          {/* StaffRegistration — SA & Manager only */} 
          <Route
            path="/StaffRegistration"
            element={
              <RequireAuth>
                <RequireRole allowed={[ROLES.SUPER_ADMIN, ROLES.MANAGER]}>
                  <StaffRegistration />
                </RequireRole>
              </RequireAuth>
            }
          />
        </Routes> 
      </Router>
    </AuthProvider>
  );
}
