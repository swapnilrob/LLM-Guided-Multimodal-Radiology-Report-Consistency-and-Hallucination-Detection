import { useNavigate, useLocation } from 'react-router-dom';
import { Home, FileText, Sparkles, Settings } from 'lucide-react';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const sidebarItems = [
    { icon: Home, path: '/', title: 'Dashboard' },
    { icon: FileText, path: '/history', title: 'Reports' },
    { icon: Sparkles, path: '/upload', title: 'New Analysis' },
    { icon: Settings, path: '/settings', title: 'Settings' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="bg-chrome-dark w-12 flex flex-col items-center py-4 gap-4">
      {sidebarItems.map((item) => (
        <button
          key={item.path}
          onClick={() => navigate(item.path)}
          title={item.title}
          className={`p-2 rounded transition-colors
                     ${isActive(item.path)
                       ? 'text-white border-l-2 border-white'
                       : 'text-white/60 hover:text-white'
                     }`}
        >
          <item.icon className="w-5 h-5" />
        </button>
      ))}
    </aside>
  );
} 