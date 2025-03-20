import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    const { token } = useAuth();

    return token ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;
