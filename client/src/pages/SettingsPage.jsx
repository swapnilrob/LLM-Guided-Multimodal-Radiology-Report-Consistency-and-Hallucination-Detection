import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Shield,
  LogOut,
  Key,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Monitor,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { logoutUser } from '../api/authApi';
import Layout from '../components/layout/Layout';
import SectionHeader from '../components/common/SectionHeader';

export default function SettingsPage() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  // ── Change password state ──
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // ── Handle password change ──
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Validation
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordError('All fields are required.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    if (currentPassword === newPassword) {
      setPasswordError('New password must be different from current password.');
      return;
    }

    setPasswordLoading(true);

    try {
      // TODO: Call backend change password endpoint when available
      // await API.put('/auth/change-password', { currentPassword, newPassword }, {
      //   headers: { Authorization: `Bearer ${token}` }
      // });

      setPasswordSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      setPasswordError(
        err.response?.data?.message || 'Failed to change password. Please try again.'
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  // ── Handle sign out ──
  const handleSignOut = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error('Logout API error:', err);
    }
    logout();
    navigate('/login');
  };

  // ── Handle sign out all devices ──
  const handleSignOutAll = async () => {
    if (!window.confirm('This will sign you out of all devices. Continue?')) return;

    try {
      await logoutUser();
    } catch (err) {
      console.error('Logout API error:', err);
    }
    logout();
    navigate('/login');
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-4">
        {/* ── Page Header ── */}
        <div>
          <h1 className="text-xl font-bold text-text-dark">Settings</h1>
          <p className="text-sm text-text-medium mt-0.5">
            Manage your profile, security, and preferences
          </p>
        </div>

        {/* ══════════════════════════════════════════ */}
        {/* SECTION 1: PROFILE INFO                   */}
        {/* ══════════════════════════════════════════ */}
        <div className="bg-panel rounded border border-border-light overflow-hidden">
          <SectionHeader number="1" title="PROFILE INFORMATION" />

          <div className="p-4 space-y-4">
            {/* Full Name */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-chrome-dark rounded-full flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-lg">
                  {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-dark">
                  {user?.fullName || 'Unknown User'}
                </p>
                <p className="text-xs text-text-medium">
                  {user?.role === 'admin' ? 'Administrator' :
                   user?.role === 'clinician' ? 'Clinician' : 'General User'}
                </p>
              </div>
            </div>

            {/* Info rows */}
            <div className="space-y-3 pt-2 border-t border-border-light">
              {/* Email */}
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-text-light shrink-0" />
                <div>
                  <p className="text-xs text-text-medium">Email Address</p>
                  <p className="text-sm text-text-dark">{user?.email || '—'}</p>
                </div>
              </div>

              {/* Role */}
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-text-light shrink-0" />
                <div>
                  <p className="text-xs text-text-medium">Account Role</p>
                  <p className="text-sm text-text-dark capitalize">{user?.role || 'general_user'}</p>
                </div>
              </div>

              {/* 2FA Status */}
              <div className="flex items-center gap-3">
                <Key className="w-4 h-4 text-text-light shrink-0" />
                <div>
                  <p className="text-xs text-text-medium">Two-Factor Authentication</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {user?.twoFactorEnabled ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-status-verified">
                        <Check className="w-3 h-3" />
                        Enabled
                      </span>
                    ) : (
                      <span className="text-xs text-text-medium">Not enabled</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Member since */}
              <div className="flex items-center gap-3">
                <Monitor className="w-4 h-4 text-text-light shrink-0" />
                <div>
                  <p className="text-xs text-text-medium">Member Since</p>
                  <p className="text-sm text-text-dark">
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════ */}
        {/* SECTION 2: CHANGE PASSWORD                */}
        {/* ══════════════════════════════════════════ */}
        <div className="bg-panel rounded border border-border-light overflow-hidden">
          <SectionHeader number="2" title="CHANGE PASSWORD" />

          <div className="p-4">
            {/* Success message */}
            {passwordSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-status-verified text-sm flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                {passwordSuccess}
              </div>
            )}

            {/* Error message */}
            {passwordError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-status-hallucinated text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {passwordError}
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-3">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-text-dark mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full bg-input-bg border border-border-light rounded px-3 py-2.5 text-sm text-text-dark
                               placeholder:text-text-light pr-10
                               focus:border-border-focus focus:ring-1 focus:ring-border-focus focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light hover:text-text-medium transition-colors"
                  >
                    {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-text-dark mb-1">
                  New Password
                </label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full bg-input-bg border border-border-light rounded px-3 py-2.5 text-sm text-text-dark
                             placeholder:text-text-light
                             focus:border-border-focus focus:ring-1 focus:ring-border-focus focus:outline-none transition-colors"
                />
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-sm font-medium text-text-dark mb-1">
                  Confirm New Password
                </label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full bg-input-bg border border-border-light rounded px-3 py-2.5 text-sm text-text-dark
                             placeholder:text-text-light
                             focus:border-border-focus focus:ring-1 focus:ring-border-focus focus:outline-none transition-colors"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={passwordLoading}
                className="bg-chrome-section text-white px-5 py-2.5 rounded text-sm font-semibold uppercase tracking-wider
                           hover:bg-chrome-section-alt transition-colors
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {passwordLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>

        {/* ══════════════════════════════════════════ */}
        {/* SECTION 3: SESSION & SIGN OUT             */}
        {/* ══════════════════════════════════════════ */}
        <div className="bg-panel rounded border border-border-light overflow-hidden">
          <SectionHeader number="3" title="SESSION MANAGEMENT" />

          <div className="p-4 space-y-3">
            <p className="text-sm text-text-medium">
              Sign out of your current session or all active sessions across all devices.
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2.5 bg-chrome-section text-white rounded text-sm font-semibold uppercase tracking-wider
                           hover:bg-chrome-section-alt transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>

              <button
                onClick={handleSignOutAll}
                className="flex items-center gap-2 px-4 py-2.5 bg-panel text-status-hallucinated rounded text-sm font-semibold uppercase tracking-wider
                           border-2 border-status-hallucinated
                           hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out All Devices
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}  