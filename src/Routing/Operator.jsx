import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import {AuthContext } from '../context/AuthContext'; 


// All Import for routing
import LandingPage from '../components/LoginCreds/LandingPage';
import Login from '../components/LoginCreds/login';
import NewUser from '../components/LoginCreds/newUser';
import ResetPassword from '../components/LoginCreds/ResetPassword';
import Sidebar from '../components/DashBoard/sidebar'; 
import Settings from '../components/DashBoard/settings';
import Transaction from '../components/DashBoard/transaction';
import Report from '../components/DashBoard/report';
import DashboardOverview from '../components/DashBoard/DashboardOverview';

// Route Guard Component
const ProtectedRoute = ({ children }) => {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const Operator = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<NewUser />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected Dashboard Parent Route */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Sidebar />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboardOverview" replace />} />
          <Route path="dashboardOverview" element={<DashboardOverview />} />
          <Route path="transactions" element={<Transaction />} />
          <Route path="report" element={<Report />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Operator;