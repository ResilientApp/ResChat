import React from 'react';
import { Navigate, useRoutes } from "react-router-dom";
import MainLayout from "../layouts/main";
import DashboardLayout from "../layouts/dashboard";
import Login from '../pages/auth/Login.jsx';
import NewPassword from '../pages/auth/NewPassword.jsx';
import Register from '../pages/auth/Register.jsx';
import ResetPassword from '../pages/auth/ResetPassword.jsx';
import Settings from '../pages/dashboard/Settings';
import Profile from '../pages/dashboard/Profile';
import GeneralApp from '../pages/dashboard/GeneralApp';
import Error404 from '../pages/Error404.jsx';



export default function RoutesComponent() {
  return useRoutes([
    { path: '/', element: <Navigate to="/auth/login" replace /> },
    {
      path: '/auth',
      element: <MainLayout />,
      children: [
        { element: <Login />, path: 'login' },
        { element: <Register />, path: 'register' },
        { element: <ResetPassword />, path: 'resetpassword' },
        { element: <NewPassword />, path: 'newpassword' },
      ]
    },
    {
      path: "/",
      element: <DashboardLayout />,
      children: [
        { element: <GeneralApp />, path: 'app' },
        { element: <Settings />, path: 'settings' },
        { element: <Profile />, path: 'profile' },
        { element: <Error404 />, path: '404' }
      ]
    },
    { path: "*", element: <Navigate to="/auth/login" replace /> }
  ]);
}
