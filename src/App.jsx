import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Signup from "./pages/SignUp";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import Sell from "./pages/Sell";
import ProfilePage from "./pages/ProfilePage";
import PostFeed from "./components/PostFeed";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import NotFound from "./pages/NotFound";
import './App.css'; 
import { useState } from "react";
import ChatTest from "./components/ChatTest";
import LiveStreamApp from "./pages/Livestream";

function AppLayout({ children, isSidebarCollapsed, handleSidebarToggle }) {
    return (
        <div className="app-container">
            <Navbar /> {/* Top navbar */}
            <div className={`app-layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                <Sidebar onToggle={handleSidebarToggle} /> {/* Sidebar with toggle handler */}
                <main className="main-content">{children}</main>
            </div>
        </div>
    );
}

function AppContent() {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const handleSidebarToggle = (isCollapsed) => {
        setIsSidebarCollapsed(isCollapsed);
    };

    const location = useLocation();
    const isAuthPage = location.pathname === "/signup" || location.pathname === "/login";

    return isAuthPage ? (
        <Routes>
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
        </Routes>
    ) : (
        <AppLayout
            isSidebarCollapsed={isSidebarCollapsed}
            handleSidebarToggle={handleSidebarToggle}
        >
            <Routes>
                <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/sell" element={<ProtectedRoute><Sell /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/profile/:id" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/postfeed" element={<ProtectedRoute><PostFeed /></ProtectedRoute>} />
                <Route path="/message" element={<ProtectedRoute><ChatTest /></ProtectedRoute>} />
                <Route path="/live" element={<ProtectedRoute><LiveStreamApp /></ProtectedRoute>} />     
                <Route path="*" element={<NotFound />} />
            </Routes>
        </AppLayout>
    );
}

function App() {
    return (
        <AuthProvider>
            <Router>
                <AppContent />
            </Router>
        </AuthProvider>
    );
}

export default App;