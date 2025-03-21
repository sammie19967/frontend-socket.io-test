import React, { useState } from 'react';
import '../styles/Navbar.css'; // Import the CSS file

const Navbar = () => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    return (
        <nav className="navbar">
            {/* Logo */}
            <div className="logo">MyStore</div>

            {/* Nav Links */}
            <div className="nav-links">
                {/* Sell Something Button */}
                <button className="sell-button">Sell Something</button>

                {/* Profile Dropdown */}
                <div className="profile-dropdown" onClick={toggleDropdown}>
                    <img
                        src="https://via.placeholder.com/40" // Replace with your profile icon
                        alt="Profile"
                        className="profile-icon"
                    />
                    {isDropdownOpen && (
                        <div className="dropdown-content">
                            <a href="#">Profile</a>
                            <a href="#">Settings</a>
                            <a href="#">Logout</a>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;