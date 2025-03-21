import React from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/Dashboard.css';
import PostUpload from '../components/postUpload';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const Dashboard = () => {
    const { user } = useAuth(); // Get user from AuthContext

    return (
        <div className="dashboard-container">
            <Navbar /> {/* Top navbar */}
            <div className="dashboard-layout">
                <Sidebar /> {/* Sidebar positioned below the navbar */}
                <div className="dashboard-content">
                    <h2 className="welcome-message">
                        Hello, <span>{user?.username || 'Guest'}</span> welcome to Jumanji!
                    </h2>
                    
                </div>
            </div>
        </div>
    );
};

export default Dashboard;