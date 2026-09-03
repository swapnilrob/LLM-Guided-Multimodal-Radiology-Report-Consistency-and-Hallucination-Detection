import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { loginUser } from '../api/authApi';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  // ── form field state ──
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // ── UI state ──
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ── hooks ──
  const { login } = useAuth();           // from AuthContext — saves user + token
  const navigate = useNavigate();         // from React Router — redirects to another page

  // ── form submit handler ──
  const handleSubmit = async (e) => {
    e.preventDefault();   // prevent the browser from refreshing the page

    // Basic validation
    if (!email.trim() || !password.trim()) {
      setError('Please fill in both fields.');
      return;
    }

    setError('');       // clear any old error
    setLoading(true);   // show loading state on the button

    try {
      // Call the backend login endpoint
      const data = await loginUser(email, password);

      // If 2FA is required, the backend returns { twoFactorRequired: true }
      if (data.twoFactorRequired) {
        // For now, just show a message — 2FA page will be built later
        setError('Two-factor authentication required. (2FA page coming soon)');
        setLoading(false);
        return;
      }

      // Success! Save the user and token in AuthContext
      login(data.user, data.accessToken);

      // Redirect to the dashboard
      navigate('/');
    } catch (err) {
      // Show the error message from the backend, or a generic one
      const message =
        err.response?.data?.message || 'Login failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);  // stop the loading spinner regardless of success/failure
    }
  };

  return (
    <div className="min-h-screen bg-page flex items-center justify-center px-4">
      <div className="bg-panel w-full max-w-md rounded border border-border-light p-8">

        {/* ── Logo / Title ── */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-chrome-dark rounded-lg flex items-center justify-center mb-3">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-chrome-dark">
            Radiology Report Checker
          </h1>
          <p className="text-text-medium text-sm mt-1">
            Sign in to your account
          </p>
        </div>

        {/* ── Error message ── */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-status-hallucinated text-sm">
            {error}
          </div>
        )}

        {/* ── Login Form ── */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Email field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text-dark mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-input-bg border border-border-light rounded px-3 py-2.5 text-text-dark text-sm
                         placeholder:text-text-light
                         focus:border-border-focus focus:ring-1 focus:ring-border-focus focus:outline-none
                         transition-colors"
            />
          </div>

          {/* Password field with show/hide toggle */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-text-dark mb-1">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full bg-input-bg border border-border-light rounded px-3 py-2.5 text-text-dark text-sm
                           placeholder:text-text-light pr-10
                           focus:border-border-focus focus:ring-1 focus:ring-border-focus focus:outline-none
                           transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light hover:text-text-medium transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-chrome-section text-white py-3 rounded font-semibold text-sm uppercase tracking-wider
                       hover:bg-chrome-section-alt transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* ── Register link ── */}
        <p className="text-center text-sm text-text-medium mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-accent-teal font-medium hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}  