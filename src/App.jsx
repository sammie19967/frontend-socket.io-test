import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Signup from './pages/SignUp';
import Login from './pages/Login'
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Sell from './pages/Sell';
import ProfilePage from './pages/ProfilePage';
import PostFeed from './components/PostFeed';

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/sell" element={<Sell/>}/>
                    <Route path="/profile" element={<ProfilePage/>}/>
                    <Route path='/postfeed' element={<PostFeed/>}/>

                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
