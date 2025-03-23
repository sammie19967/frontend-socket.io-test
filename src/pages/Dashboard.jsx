import React from "react";
import { useAuth } from "../context/AuthContext";
import "../styles/Dashboard.css";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

import PostFeed from "../components/PostFeed";

const Dashboard = () => {
    const { user } = useAuth(); // Get user from AuthContext

    return (
        <div className="dashboard-container">
            <Navbar /> {/* Top navbar */}
            <div className="dashboard-layout">
                <Sidebar /> {/* Sidebar positioned below the navbar */}
                <div className="dashboard-content">
                    <h2 className="welcome-message">
                        Hello, <span>{user?.username || "Guest"}</span> welcome to Jumanji!
                    </h2>
                    <PostFeed />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
