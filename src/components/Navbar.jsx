import React from 'react';
import { FaUserCircle, FaPlus } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import '../styles/Navbar.css';

const Navbar = () => {
    return (
        <nav className="navbar-main">
            {/* Logo */}
            <Link to="/" className="navbar-logo">
                Jumanji<span>Live</span>
            </Link>

            {/* Sell Something Button */}
            <Link to="/sell" className="navbar-sell-button">
                <FaPlus className="navbar-sell-icon" /> Sell Something
            </Link>

            {/* Profile Section */}
            <Link to="/profile" className="navbar-profile">
                <FaUserCircle className="navbar-profile-icon" />
                
            </Link>
        </nav>
    );
};

export default Navbar;