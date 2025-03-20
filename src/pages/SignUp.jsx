import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/Signup.css'; 

const Signup = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        role: 'buyer',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
    
        try {
            console.log('Sending data:', formData);
    
            const res = await axios.post('http://localhost:5000/api/auth/signup', formData, {
                headers: { 'Content-Type': 'application/json' },
            });
    
            console.log('Response from server:', res.data);
    
            alert('Signup successful! Please log in.'); // ✅ Show success message
            navigate('/login'); // ✅ Redirect to login page instead of dashboard
        } catch (err) {
            console.error('Signup error:', err.response);
            setError(err.response?.data?.message || 'Signup failed');
        } finally {
            setLoading(false);
        }
    };
    
    

    return (
        <div className="auth-container">
            <h2>Signup</h2>
            {error && <p className="error">{error}</p>}
            <form onSubmit={handleSubmit}>
                <input type="text" name="username" placeholder="Username" onChange={handleChange} required />
                <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
                <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
                <select name="role" onChange={handleChange}>
                    <option value="buyer">Buyer</option>
                    <option value="seller">Seller</option>
                </select>
                <button type="submit" disabled={loading}>{loading ? 'Signing Up...' : 'Signup'}</button>
            </form>
        </div>
    );
};

export default Signup;
