import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './AuthCard.css'; // For flip animation styles

export const AuthCard = () => {
    const [isFlipped, setIsFlipped] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const resetForm = () => {
        setUsername('');
        setPassword('');
        setError('');
        setLoading(false);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await axios.post('http://localhost:3000/api/login', { username, password });
            login(response.data.token);
            navigate('/');
        } catch (err) {
            setError('Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await axios.post('http://localhost:3000/api/register', { username, password });
            login(response.data.token);
            navigate('/');
        } catch (err) {
            setError('Username already exists');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 login-container">
            <div className="flip-container">
                <div className={`flip-card ${isFlipped ? 'flipped' : ''}`}>
                    {/* FRONT SIDE - LOGIN */}
                    <div className="card-front bg-white/60 backdrop-blur-md p-8 rounded-2xl shadow-2xl max-w-md w-full space-y-6">
                        <div className="text-center">
                            <LogIn className="mx-auto h-12 w-12 text-indigo-600" />
                            <h2 className="mt-4 text-3xl font-bold text-gray-900">Welcome back</h2>
                            <p className="mt-1 text-sm text-gray-600">Sign in to continue</p>
                        </div>
                        <form className="space-y-5" onSubmit={handleLogin}>
                            {error && <div className="text-red-500 text-center">{error}</div>}
                            <input
                                type="text"
                                required
                                placeholder="Username"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-400"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                            <input
                                type="password"
                                required
                                placeholder="Password"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-400"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-3 text-white font-medium rounded-xl transition ${loading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                            >
                                {loading ? 'Signing in...' : 'Sign in'}
                            </button>
                        </form>
                        <div className="text-center text-sm">
                            Don’t have an account?{' '}
                            <span
                                className="text-indigo-600 hover:underline font-medium cursor-pointer"
                                onClick={() => {
                                    resetForm();
                                    setIsFlipped(true);
                                }}
                            >
                                Sign up
                            </span>
                        </div>
                    </div>

                    {/* BACK SIDE - REGISTER */}
                    <div className="card-back bg-white/60 backdrop-blur-md p-8 rounded-2xl shadow-2xl max-w-md w-full space-y-6">
                        <div className="text-center">
                            <UserPlus className="mx-auto h-12 w-12 text-indigo-600" />
                            <h2 className="mt-4 text-3xl font-bold text-gray-900">Create your account</h2>
                            <p className="mt-1 text-sm text-gray-600">Sign up to get started</p>
                        </div>
                        <form className="space-y-5" onSubmit={handleRegister}>
                            {error && <div className="text-red-500 text-center">{error}</div>}
                            <input
                                type="text"
                                required
                                placeholder="Username"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-400"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                            <input
                                type="password"
                                required
                                placeholder="Password"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-400"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-3 text-white font-medium rounded-xl transition ${loading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                            >
                                {loading ? 'Signing up...' : 'Sign up'}
                            </button>
                        </form>
                        <div className="text-center text-sm">
                            Already have an account?{' '}
                            <span
                                className="text-indigo-600 hover:underline font-medium cursor-pointer"
                                onClick={() => {
                                    resetForm();
                                    setIsFlipped(false);
                                }}
                            >
                                Sign in
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
