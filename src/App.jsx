import React from 'react';
import { Route, Routes, Navigate, useLocation } from 'react-router-dom';
import Login from './components/login_page/Login';
import AdminHome from './components/admin_page/page/admin_home';
import UserHome from './components/user_page/page/user_home';
import PrivateRoute from './components/PrivateRoute';
import ManageUsers from './components/admin_page/page/mannage_user';
//admin
import AddChaineseData from './components/admin_page/page/add_data/chinese_data';
import AddThaiData from './components/admin_page/page/add_data/thai_data';
//noti
import UserNoti from './components/user_page/page/notification/user_noti';
import UserNotiThai from './components/user_page/page/notification/user_notithai';
//user data
import UserChainesedata from './components/user_page/page/user_data/chinese_data';
import UserThaiData from './components/user_page/page/user_data/thai_data';
//check code
import CheckCode from './components/login_page/check';

const App = () => {
  const location = useLocation();
  const isAuthenticated = !!localStorage.getItem('token');
  const publicPaths = ['/', '/check-code']; // Add all public paths here

  // Only redirect if not authenticated AND trying to access a protected route
  if (!isAuthenticated && !publicPaths.includes(location.pathname)) {
    return <Navigate to="/" />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Login />} />
      <Route path="/check-code" element={<CheckCode />} />

      {/* Protected Routes */}
      <Route path="/home-admin" element={<PrivateRoute><AdminHome /></PrivateRoute>} />
      <Route path="/add-chainesedata/:id" element={<PrivateRoute><AddChaineseData /></PrivateRoute>} />
      <Route path="/add-thaidata/:id" element={<PrivateRoute><AddThaiData /></PrivateRoute>} />
      <Route path="/manage-users" element={<PrivateRoute><ManageUsers /></PrivateRoute>} />

      <Route path="/home-user/" element={<PrivateRoute><UserHome /></PrivateRoute>} />
      <Route path="/usernoti/" element={<PrivateRoute><UserNoti /></PrivateRoute>} />
      <Route path="/usernoti-thai/" element={<PrivateRoute><UserNotiThai /></PrivateRoute>} />
      <Route path="/user-chainesedata/:id" element={<PrivateRoute><UserChainesedata /></PrivateRoute>} />
      <Route path="/user-thaidata/:id" element={<PrivateRoute><UserThaiData /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default App;