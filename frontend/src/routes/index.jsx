import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from '../pages/auth/Login.jsx';
const Home = () => <h2>Welcome to ResChat, Development Underway</h2>;
const About = () => <h2>About</h2>;
const Contact = () => <h2>Contact</h2>;

const RoutesComponent = () => {
  return (
    <Router>
      <Routes>
        <Route exact path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
};

export default RoutesComponent;
