import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Signup from './pages/SignUp';
import Login from './pages/Login'
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Sell from './pages/Sell';
import Profile from './pages/Profile';
import LiveStream from './pages/Live';

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/sell" element={<Sell/>}/>
                    <Route path="/profile:id" element={<Profile/>}/>
                    <Route path='/live' element={<LiveStream/>}/>

                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
