import { LayoutDashboard, FileText, User, Settings, Bell } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="bg-chrome-dark h-12 flex items-center justify-between px-4 text-white">
      <span className="font-bold text-sm tracking-wide">
        Radiology Report Analyzer
      </span>

      <div className="flex items-center gap-6 text-xs tracking-wider font-semibold">
        <div className="flex items-center gap-1.5 hover:text-accent-teal-light cursor-pointer">
          <LayoutDashboard size={14} />
          DASHBOARD
        </div>
        <div className="flex items-center gap-1.5 hover:text-accent-teal-light cursor-pointer">
          <FileText size={14} />
          REPORTS
        </div>
        <div className="flex items-center gap-1.5 hover:text-accent-teal-light cursor-pointer">
          <User size={14} />
          USER: DR. SMITH
        </div>
        <div className="flex items-center gap-1.5 hover:text-accent-teal-light cursor-pointer">
          <Settings size={14} />
          SETTINGS
        </div>
        <div className="flex items-center gap-1.5 hover:text-accent-teal-light cursor-pointer relative">
          <Bell size={14} />
          NOTIFICATIONS
          <span className="bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center absolute -top-2 -right-2">
            3
          </span>
        </div>
      </div>
    </nav>
  );
} 