import React from 'react';
import { useRoutes } from "react-router-dom";
import MainLayout from "../layouts/main";
import DashboardLayout from "../layouts/dashboard";
import Login from '../pages/auth/Login.jsx';
import NewPassword from '../pages/auth/NewPassword.jsx';
import Register from '../pages/auth/Register.jsx';
import ResetPassword from '../pages/auth/ResetPassword.jsx';

const Home = () => <h2>Welcome to ResChat, Development Underway</h2>;
const About = () => <h2>About</h2>;
const Contact = () => <h2>Contact</h2>;

export default function RoutesComponent() {
  return useRoutes([
    {
      path: '/auth',
      element: <MainLayout/>,
      children:[
        {element: <Login/>, path:'login'},
        {element: <Register/>, path:'register'},
        {element: <ResetPassword/>, path:'resetpassword'},
        {element: <NewPassword/>, path:'newpassword'},
      ]
    },
    {
      path: "/",
      element: <DashboardLayout />,
      children: [
        {element: <Home/>, path:'app'},
        {element: <About/>, path:'about'},
        {element: <Contact/>, path:'contact'},
      ],
    }
  ]);
}
