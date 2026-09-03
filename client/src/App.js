import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';

// Placeholder pages — you will replace these with real components
function DashboardPage() {
  return (
    <Layout>
      <div className="bg-panel p-6 rounded border border-border-light">
        <h1 className="text-xl font-bold text-text-dark">Dashboard</h1>
        <p className="text-text-medium mt-2">Dashboard content will go here.</p>
      </div>
    </Layout>
  );
}

function LoginPage() {
  return (
    <div className="min-h-screen bg-page flex items-center justify-center">
      <div className="bg-panel p-8 rounded border border-border-light w-full max-w-md">
        <h1 className="text-xl font-bold text-chrome-dark text-center">Sign In</h1>
        <p className="text-text-medium text-center mt-2">Login form will go here.</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<DashboardPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App; 