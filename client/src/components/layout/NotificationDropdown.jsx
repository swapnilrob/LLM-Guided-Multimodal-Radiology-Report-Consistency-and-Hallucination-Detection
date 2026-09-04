import { useState, useEffect, useRef } from 'react';
import { Bell, X, CheckCircle2, AlertTriangle, Info, FileText } from 'lucide-react';

// Sample notifications — in production these come from the backend
const SAMPLE_NOTIFICATIONS = [
  {
    id: 1,
    type: 'success',
    title: 'Analysis Complete',
    message: 'Your report analysis has finished. Reliability score: 72/100.',
    time: '2 minutes ago',
    read: false,
  },
  {
    id: 2,
    type: 'warning',
    title: 'Hallucination Detected',
    message: '2 claims flagged as potential hallucinations in your latest report.',
    time: '15 minutes ago',
    read: false,
  },
  {
    id: 3,
    type: 'info',
    title: 'Welcome!',
    message: 'Welcome to the Radiology Report Analyzer. Upload your first report to get started.',
    time: '1 hour ago',
    read: true,
  },
];

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(SAMPLE_NOTIFICATIONS);
  const dropdownRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Mark a single notification as read
  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Dismiss a notification
  const dismiss = (id, e) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Get icon by notification type
  const getIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-4 h-4 text-status-verified shrink-0" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-status-mismatch shrink-0" />;
      case 'info': return <Info className="w-4 h-4 text-accent-teal shrink-0" />;
      default: return <FileText className="w-4 h-4 text-text-medium shrink-0" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors relative"
      >
        <Bell className="w-4 h-4" />
        <span className="text-xs tracking-wider font-semibold">NOTIFICATIONS</span>

        {unreadCount > 0 && (
          <span className="absolute -top-1 left-3 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-10 w-80 bg-panel rounded border border-border-light shadow-lg z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border-light">
            <h3 className="text-sm font-semibold text-text-dark">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-accent-teal hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Bell className="w-6 h-6 text-text-light mb-2" />
                <p className="text-xs text-text-medium">No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => markAsRead(notification.id)}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-border-light cursor-pointer transition-colors
                             ${notification.read ? 'bg-panel' : 'bg-row-selected'}`}
                >
                  {/* Icon */}
                  <div className="mt-0.5">{getIcon(notification.type)}</div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold ${notification.read ? 'text-text-medium' : 'text-text-dark'}`}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-text-medium mt-0.5 leading-relaxed">
                      {notification.message}
                    </p>
                    <p className="text-[10px] text-text-light mt-1">{notification.time}</p>
                  </div>

                  {/* Dismiss button */}
                  <button
                    onClick={(e) => dismiss(notification.id, e)}
                    className="text-text-light hover:text-text-medium transition-colors shrink-0"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}  