import React from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/Dashboard.css';
import PostUpload from '../components/postUpload';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const Dashboard = () => {
    const { user } = useAuth(); // Get user from AuthContext

    return (
      <div>
        <div className="dashboard">
        
          <><Sidebar/></>
            <h2 className="welcome-message">Hello,
              <span>{user?.username || 'Guest'}</span> welcome to Jumanji!</h2>
             
        </div>
        <PostUpload/>
    </div>
    );
};

export default Dashboard;