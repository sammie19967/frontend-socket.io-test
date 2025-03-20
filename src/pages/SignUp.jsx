import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/SignUp.css';

const Signup = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'buyer',
    });
    const [step, setStep] = useState(1); // Track current step
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showPassword, setShowPassword] = useState(false); // Toggle password visibility
    const [showConfirmPassword, setShowConfirmPassword] = useState(false); // Toggle confirm password visibility

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const nextStep = () => {
        // Validate current step before proceeding
        if (step === 1 && (!formData.username || !formData.email)) {
            setError('Please fill in all fields.');
            return;
        }
        if (step === 2) {
            if (!formData.password || !formData.confirmPassword) {
                setError('Please fill in all fields.');
                return;
            }
            if (formData.password.length < 6) {
                setError('Password must contain at least 6 characters.');
                return;
            }
            if (formData.password !== formData.confirmPassword) {
                setError('Passwords do not match.');
                return;
            }
        }
        setError('');
        setStep(step + 1);
    };

    const prevStep = () => {
        setStep(step - 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const res = await axios.post('http://localhost:5000/api/auth/signup', formData, {
                headers: { 'Content-Type': 'application/json' },
            });

            setSuccess('Signup successful! Redirecting to login...');
            setTimeout(() => navigate('/login'), 1500); // Redirect to login after 1.5 seconds
        } catch (err) {
            setError(err.response?.data?.message || 'Signup failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <h2>Signup</h2>
            {error && <p className="error-message">{error}</p>}
            {success && <p className="success-message">{success}</p>}
            <form onSubmit={handleSubmit}>
                {/* Step 1: Username and Email */}
                {step === 1 && (
                    <div className="form-step">
                        <div className="form-group">
                            <label htmlFor="username">Username</label>
                            <input
                                type="text"
                                name="username"
                                id="username"
                                placeholder="Enter your username"
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                name="email"
                                id="email"
                                placeholder="Enter your email"
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <button type="button" className="next-button" onClick={nextStep}>
                            Next
                        </button>
                    </div>
                )}

                {/* Step 2: Password and Confirm Password */}
                {step === 2 && (
                    <div className="form-step">
                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <div className="password-input">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    id="password"
                                    placeholder="Enter your password"
                                    onChange={handleChange}
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle-button"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? '👁️' : '👁️‍🗨️'}
                                </button>
                            </div>
                        </div>
                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <div className="password-input">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    name="confirmPassword"
                                    id="confirmPassword"
                                    placeholder="Confirm your password"
                                    onChange={handleChange}
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle-button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                                </button>
                            </div>
                        </div>
                        <div className="step-buttons">
                            <button type="button" className="prev-button" onClick={prevStep}>
                                Back
                            </button>
                            <button type="button" className="next-button" onClick={nextStep}>
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Role and Submit */}
                {step === 3 && (
                    <div className="form-step">
                        <div className="form-group">
                            <label htmlFor="role">Role</label>
                            <select name="role" id="role" onChange={handleChange}>
                                <option value="buyer">Buyer</option>
                                <option value="seller">Seller</option>
                            </select>
                        </div>
                        <div className="step-buttons">
                            <button type="button" className="prev-button" onClick={prevStep}>
                                Back
                            </button>
                            <button type="submit" disabled={loading}>
                                {loading ? 'Signing Up...' : 'Signup'}
                            </button>
                        </div>
                    </div>
                )}
            </form>
            <p className="auth-switch">
                Already have an account? <Link to="/login">Login</Link>
            </p>
        </div>
    );
};

export default Signup;