import React from 'react';
import { Route, Routes, Navigate, useLocation } from 'react-router-dom';
import Login from './components/login_page/Login';
import HomeAdmin from './components/admin_page/page/home_admin';
import UserHome from './components/user_page/page/home_user';

import PrivateRoute from './components/PrivateRoute';
import ManageUsers from './components/admin_page/page/mannage_user';
import AddData from './components/admin_page/page/add_data';
import UserAddData from './components/user_page/page/user_data';

const App = () => {
  const location = useLocation();
  const isAuthenticated = !!localStorage.getItem('token');

  // Redirect to login if not authenticated
  if (!isAuthenticated && location.pathname !== '/') {
    return <Navigate to="/" />;
  }

  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/home-admin" element={<PrivateRoute><HomeAdmin /></PrivateRoute>} />
      <Route path="/add-data/:id" element={<PrivateRoute><AddData /></PrivateRoute>} />
      <Route path="/manage-users" element={<PrivateRoute><ManageUsers /></PrivateRoute>} />


      <Route path="/home-user/" element={<PrivateRoute><UserHome /></PrivateRoute>} />
      <Route path="/user-data/:id" element={<PrivateRoute><UserAddData /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default App;
