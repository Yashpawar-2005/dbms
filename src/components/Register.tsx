import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { UserPlus } from 'lucide-react';

export const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await axios.post('http://localhost:3000/api/register', {
        username,
        password,
      });
      login(response.data.token);
      navigate('/');
    } catch (err) {
      setError('Username already exists');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 register-page bg-indigo-900">
      {/* Title */}
      <h1
        className="text-4xl mb-6 text-center"
        style={{
          color: 'white',
          fontFamily: "'Playfair Display', serif",
        }}
      >
        Shared Expense Tracker
      </h1>

      {/* Register Box */}
      <div className="max-w-md w-full space-y-6 register-box bg-white p-8 rounded-xl shadow-xl transition duration-300 transform hover:scale-[1.01]">
        <div className="text-center">
          <UserPlus className="mx-auto h-12 w-12 text-indigo-600" />
          <h2 className="mt-4 text-3xl font-bold text-gray-900">Create your account</h2>
          <p className="mt-1 text-sm text-gray-600">Sign up to get started</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && <div className="text-red-500 text-center">{error}</div>}

          <div>
            <input
              type="text"
              required
              placeholder="Username"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <input
              type="password"
              required
              placeholder="Password"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 text-white font-medium rounded-xl transition ${loading
                  ? 'bg-indigo-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
            >
              {loading ? 'Signing up...' : 'Sign up'}
            </button>
          </div>
        </form>

        <div className="text-center text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 hover:underline font-medium">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};
