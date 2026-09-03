import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { registerUser } from '../api/authApi';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  // ── form field state ──
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // ── UI state ──
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // ── hooks ──
  const { login } = useAuth();
  const navigate = useNavigate();

  // ── validation function ──
  const validate = () => {
    const errors = {};

    if (!fullName.trim()) {
      errors.fullName = 'Full name is required.';
    }

    if (!email.trim()) {
      errors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;  // returns true if no errors
  };

  // ── form submit handler ──
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Run validation — if it fails, stop here
    if (!validate()) return;

    setError('');
    setLoading(true);

    try {
      const data = await registerUser(fullName, email, password);

      // Auto-login after successful registration
      login(data.user, data.accessToken);

      // Redirect to dashboard
      navigate('/');
    } catch (err) {
      const message =
        err.response?.data?.message || 'Registration failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // ── helper: renders a red error message below a field ──
  const FieldError = ({ field }) => {
    if (!fieldErrors[field]) return null;
    return (
      <p className="text-status-hallucinated text-xs mt-1">{fieldErrors[field]}</p>
    );
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
            Create Your Account
          </h1>
          <p className="text-text-medium text-sm mt-1">
            Join the radiology report verification platform
          </p>
        </div>

        {/* ── Server error message ── */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-status-hallucinated text-sm">
            {error}
          </div>
        )}

        {/* ── Registration Form ── */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-text-dark mb-1">
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Dr. Jane Smith"
              className={`w-full bg-input-bg border rounded px-3 py-2.5 text-text-dark text-sm
                         placeholder:text-text-light
                         focus:border-border-focus focus:ring-1 focus:ring-border-focus focus:outline-none
                         transition-colors
                         ${fieldErrors.fullName ? 'border-status-hallucinated' : 'border-border-light'}`}
            />
            <FieldError field="fullName" />
          </div>

          {/* Email */}
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
              className={`w-full bg-input-bg border rounded px-3 py-2.5 text-text-dark text-sm
                         placeholder:text-text-light
                         focus:border-border-focus focus:ring-1 focus:ring-border-focus focus:outline-none
                         transition-colors
                         ${fieldErrors.email ? 'border-status-hallucinated' : 'border-border-light'}`}
            />
            <FieldError field="email" />
          </div>

          {/* Password */}
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
                placeholder="Minimum 8 characters"
                className={`w-full bg-input-bg border rounded px-3 py-2.5 text-text-dark text-sm
                           placeholder:text-text-light pr-10
                           focus:border-border-focus focus:ring-1 focus:ring-border-focus focus:outline-none
                           transition-colors
                           ${fieldErrors.password ? 'border-status-hallucinated' : 'border-border-light'}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light hover:text-text-medium transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <FieldError field="password" />
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-dark mb-1">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              className={`w-full bg-input-bg border rounded px-3 py-2.5 text-text-dark text-sm
                         placeholder:text-text-light
                         focus:border-border-focus focus:ring-1 focus:ring-border-focus focus:outline-none
                         transition-colors
                         ${fieldErrors.confirmPassword ? 'border-status-hallucinated' : 'border-border-light'}`}
            />
            <FieldError field="confirmPassword" />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-chrome-section text-white py-3 rounded font-semibold text-sm uppercase tracking-wider
                       hover:bg-chrome-section-alt transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        {/* ── Login link ── */}
        <p className="text-center text-sm text-text-medium mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-accent-teal font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
} 