import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StatusBadge from './components/common/StatusBadge';
import SectionHeader from './components/common/SectionHeader';
import ReliabilityGauge from './components/common/ReliabilityGauge';

// ── Protected Route wrapper ──
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// ── Placeholder Dashboard with component tests ──
function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <Layout>
      <div className="bg-panel p-6 rounded border border-border-light">
        <h1 className="text-xl font-bold text-text-dark">
          Welcome{user?.fullName ? `, ${user.fullName}` : ''}!
        </h1>
        <p className="text-text-medium mt-2 mb-6">
          Component test — these will be removed once real pages are built.
        </p>

        {/* Test StatusBadge */}
        <div className="flex flex-wrap gap-2 mb-6">
          <StatusBadge status="verified" />
          <StatusBadge status="hallucinated" count={2} />
          <StatusBadge status="mismatch" count={1} />
          <StatusBadge status="uncertain" />
        </div>

        {/* Test SectionHeader */}
        <div className="mb-6 border border-border-light rounded overflow-hidden">
          <SectionHeader number="1" title="INPUT & ANALYSIS" />
          <div className="p-4 text-sm text-text-medium">
            Panel content goes here.
          </div>
        </div>

        {/* Test ReliabilityGauge */}
        <div className="flex gap-8">
          <ReliabilityGauge score={28} />
          <ReliabilityGauge score={55} />
          <ReliabilityGauge score={82} />
        </div>

        <button
          onClick={logout}
          className="mt-6 px-4 py-2 bg-chrome-section text-white text-sm font-semibold uppercase tracking-wider rounded
                     hover:bg-chrome-section-alt transition-colors"
        >
          Sign Out
        </button>
      </div>
    </Layout>
  );
}

// ── Main App ──
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App; 