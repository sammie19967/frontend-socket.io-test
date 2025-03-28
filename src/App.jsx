import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Signup from "./pages/SignUp";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import Sell from "./pages/Sell";
import ProfilePage from "./pages/ProfilePage";
import PostFeed from "./components/PostFeed";
import Navbar from "./components/Navbar"; // Ensure Navbar is imported
import Sidebar from "./components/Sidebar"; // Ensure Sidebar is imported
import NotFound from "./pages/NotFound"; // Import NotFound component

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Routes without layout */}
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />

          {/* Routes with layout */}
          <Route
            path="/*"
            element={
              <div className="app-container">
                <Navbar /> {/* Top navbar */}
                <div className="app-layout">
                  <Sidebar /> {/* Sidebar positioned below the navbar */}
                  <Routes>
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/sell" element={<Sell />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/postfeed" element={<PostFeed />} />
                    {/* Catch-all route for Not Found */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </div>
              </div>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
