import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, User, Settings, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Navigation items
  const navItems = [
    { label: 'DASHBOARD', icon: LayoutDashboard, path: '/' },
    { label: 'REPORTS', icon: FileText, path: '/history' },
    { label: 'SETTINGS', icon: Settings, path: '/settings' },
  ];

  // Check if a nav item is active
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-chrome-dark h-12 flex items-center px-4 text-white">
      {/* App title */}
      <span
        onClick={() => navigate('/')}
        className="font-bold text-sm tracking-wide cursor-pointer"
      >
        Radiology Report Analyzer
      </span>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Nav links */}
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

        {/* User name */}
        <span className="flex items-center gap-1.5 text-white/60">
          <User className="w-4 h-4" />
          USER: {user?.fullName?.toUpperCase() || 'GUEST'}
        </span>

        {/* Notifications */}
        <button
          onClick={() => {}}
          className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors relative"
        >
          <Bell className="w-4 h-4" />
          NOTIFICATIONS
          <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
            3
          </span>
        </button>
      </div>
    </nav>
  );
}  