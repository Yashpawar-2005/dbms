import React,
{ useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { LogIn } from 'lucide-react';

export const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await axios.post('http://localhost:3000/api/login', {
        username,
        password,
      });
      login(response.data.token);
      navigate('/');
    } catch (err) {
      setError('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 login-container">
      <div className="max-w-md w-full space-y-6 p-8 login-box transition duration-300 transform hover:scale-[1.01]">
        <div className="text-center">
          <LogIn className="mx-auto h-12 w-12 text-indigo-600" />
          <h2 className="mt-4 text-3xl font-bold text-gray-900">Welcome back</h2>
          <p className="mt-1 text-sm text-gray-600">Sign in to continue</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && <div className="text-red-500 text-center">{error}</div>}

          <div>
            <label htmlFor="username" className="sr-only">Username</label>
            <input
              id="username"
              type="text"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="password" className="sr-only">Password</label>
            <input
              id="password"
              type="password"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
              placeholder="Password"
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
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>

        <div className="text-center text-sm">
          Don’t have an account?{' '}
          <Link to="/register" className="text-indigo-600 hover:underline font-medium">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
};
