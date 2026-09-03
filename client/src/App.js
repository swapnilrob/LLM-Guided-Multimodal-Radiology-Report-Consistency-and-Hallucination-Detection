import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// ── Protected Route wrapper ──
// If the user is NOT logged in, redirect them to /login
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// ── Placeholder Dashboard (you will replace this later) ──
function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <Layout>
      <div className="bg-panel p-6 rounded border border-border-light">
        <h1 className="text-xl font-bold text-text-dark">
          Welcome{user?.fullName ? `, ${user.fullName}` : ''}!
        </h1>
        <p className="text-text-medium mt-2">
          Your dashboard will be built here. The backend and AI pipeline are ready.
        </p>
        <button
          onClick={logout}
          className="mt-4 px-4 py-2 bg-chrome-section text-white text-sm font-semibold uppercase tracking-wider rounded
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
          {/* Public routes — anyone can access */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes — must be logged in */}
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