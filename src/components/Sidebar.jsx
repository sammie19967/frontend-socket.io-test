import React, { useState } from 'react';
import '../styles/Sidebar.css';
import { 
    FaHome, FaSearch, FaSort, FaFilter, FaThList, FaStar, 
    FaBroadcastTower, FaBars, FaTimes 
} from 'react-icons/fa'; 

const Sidebar = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
    };

    return (
        <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            {/* Collapse Button - Hamburger to X */}
            <button className="collapse-button" onClick={toggleSidebar}>
                {isCollapsed ? <FaBars /> : <FaTimes />}
            </button>

            {/* Navigation Links */}
            <ul>
                <li><a href="/"><FaHome /><span>Home</span></a></li>
                <li><a href="/live"><FaBroadcastTower /><span>Live Now</span></a></li>
                <li><a href="/postfeed"><FaStar /><span>Featured Products</span></a></li>
                <li><a href="/search"><FaSearch /><span>Search</span></a></li>
                <li><a href="filter"><FaFilter /><span>Filter</span></a></li>
                <li><a href="/sort"><FaThList /><span>Categories</span></a></li>
                <li><a href="/sort"><FaSort /><span>Sort</span></a></li>
                
            </ul>
        </aside>
    );
};

export default Sidebar;
