import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

export default function TwoFactorPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Get the temporary token passed from the login page
  const tempToken = location.state?.tempToken || '';
  const userEmail = location.state?.email || '';

  // ── State for the 6 digit inputs ──
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Refs for each input so we can auto-focus the next one
  const inputRefs = useRef([]);

  // If no temp token, redirect back to login
  useEffect(() => {
    if (!tempToken) {
      navigate('/login', { replace: true });
    }
  }, [tempToken, navigate]);

  // ── Handle digit input ──
  const handleDigitChange = (index, value) => {
    // Only allow single digits
    if (value && !/^\d$/.test(value)) return;

    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);
    setError('');

    // Auto-focus next input when a digit is entered
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (value && index === 5) {
      const code = newDigits.join('');
      if (code.length === 6) {
        handleSubmit(code);
      }
    }
  };

  // ── Handle backspace ──
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      // Move focus to previous input on backspace when current is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  // ── Handle paste (user pastes full 6-digit code) ──
  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 0) return;

    const newDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || '';
    }
    setDigits(newDigits);

    // Focus the appropriate input
    const nextEmpty = pasted.length < 6 ? pasted.length : 5;
    inputRefs.current[nextEmpty]?.focus();

    // Auto-submit if full code pasted
    if (pasted.length === 6) {
      handleSubmit(pasted);
    }
  };

  // ── Submit the TOTP code ──
  const handleSubmit = async (code) => {
    if (!code || code.length !== 6) {
      setError('Please enter all 6 digits.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await API.post('/auth/verify-2fa', {
        tempToken,
        twoFactorToken: code,
      });

      const data = response.data;

      // Success — save user and token, redirect to dashboard
      login(data.user, data.accessToken);
      navigate('/', { replace: true });
    } catch (err) {
      const message = err.response?.data?.message || 'Invalid code. Please try again.';
      setError(message);
      // Clear the digits so user can try again
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // ── Manual submit button click ──
  const handleButtonClick = () => {
    const code = digits.join('');
    handleSubmit(code);
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
            Two-Factor Authentication
          </h1>
          <p className="text-text-medium text-sm mt-1 text-center">
            Enter the 6-digit code from your authenticator app
          </p>
          {userEmail && (
            <p className="text-text-light text-xs mt-1">{userEmail}</p>
          )}
        </div>

        {/* ── Error message ── */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-status-hallucinated text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ── 6-digit code input ── */}
        <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              disabled={loading}
              className={`w-12 h-14 text-center text-xl font-bold rounded
                         bg-input-bg border text-text-dark
                         focus:border-border-focus focus:ring-1 focus:ring-border-focus focus:outline-none
                         transition-colors
                         disabled:opacity-50
                         ${error ? 'border-status-hallucinated' : 'border-border-light'}`}
            />
          ))}
        </div>

        {/* ── Verify button ── */}
        <button
          onClick={handleButtonClick}
          disabled={loading || digits.join('').length !== 6}
          className="w-full bg-chrome-section text-white py-3 rounded font-semibold text-sm uppercase tracking-wider
                     hover:bg-chrome-section-alt transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Verifying...
            </span>
          ) : (
            'Verify Code'
          )}
        </button>

        {/* ── Help text ── */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-xs text-text-light">
            Open your authenticator app (Google Authenticator, Authy, etc.)
            and enter the code shown for this account.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="text-xs text-accent-teal hover:underline"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
} 