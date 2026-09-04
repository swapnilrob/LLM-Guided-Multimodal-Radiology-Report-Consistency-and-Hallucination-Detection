import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1">
        {/* Desktop sidebar — always visible on lg+ */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <>
            {/* Dark overlay */}
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            {/* Sidebar panel */}
            <div className="fixed left-0 top-12 bottom-0 z-50 lg:hidden">
              <Sidebar onNavigate={() => setSidebarOpen(false)} />
            </div>
          </>
        )}

        <main className="flex-1 bg-page p-3 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
} 