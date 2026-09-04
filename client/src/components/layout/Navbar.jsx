import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, User, Settings, Moon, Sun, BarChart3 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import NotificationDropdown from './NotificationDropdown';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();

  const navItems = [
    { label: 'DASHBOARD', icon: LayoutDashboard, path: '/' },
    { label: 'REPORTS', icon: FileText, path: '/history' },
    { label: 'ANALYTICS', icon: BarChart3, path: '/analytics' },
    { label: 'SETTINGS', icon: Settings, path: '/settings' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-chrome-dark h-12 flex items-center px-4 text-white">
      <span
        onClick={() => navigate('/')}
        className="font-bold text-sm tracking-wide cursor-pointer"
      >
        Radiology Report Analyzer
      </span>

      <div className="flex-1" />

      <div className="flex items-center gap-6 text-xs tracking-wider font-semibold">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex items-center gap-1.5 transition-colors
                       ${isActive(item.path) ? 'text-white' : 'text-white/60 hover:text-white'}`}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}

        <button
          onClick={toggleDarkMode}
          className="text-white/60 hover:text-white transition-colors"
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <span className="flex items-center gap-1.5 text-white/60">
          <User className="w-4 h-4" />
          USER: {user?.fullName?.toUpperCase() || 'GUEST'}
        </span>

        <NotificationDropdown />
      </div>
    </nav>
  );
} 