import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, User, Settings, Moon, Sun, BarChart3, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import NotificationDropdown from './NotificationDropdown';

export default function Navbar({ onMenuClick }) {
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
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden text-white/60 hover:text-white mr-3 transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* App title */}
      <span
        onClick={() => navigate('/')}
        className="font-bold text-sm tracking-wide cursor-pointer"
      >
        <span className="hidden sm:inline">Radiology Report Analyzer</span>
        <span className="sm:hidden">RRA</span>
      </span>

      <div className="flex-1" />

      <div className="flex items-center gap-3 sm:gap-6 text-xs tracking-wider font-semibold">
        {/* Nav links — hidden on mobile */}
        <div className="hidden lg:flex items-center gap-6">
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
        </div>

        {/* Dark mode toggle */}
        <button
          onClick={toggleDarkMode}
          className="text-white/60 hover:text-white transition-colors"
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User name — hidden on small screens */}
        <span className="hidden md:flex items-center gap-1.5 text-white/60">
          <User className="w-4 h-4" />
          USER: {user?.fullName?.toUpperCase() || 'GUEST'}
        </span>

        {/* Notifications */}
        <NotificationDropdown />
      </div>
    </nav>
  );
} 