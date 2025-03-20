import React from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/Dashboard.css';

const Dashboard = () => {
    const { user } = useAuth(); // Get user from AuthContext

    return (
        <div className="dashboard">
            <h2 className="welcome-message">Hello,
              <span>{user?.username || 'Guest'}</span> welcome to Jumanji!</h2>
        </div>
    );
};

export default Dashboard;