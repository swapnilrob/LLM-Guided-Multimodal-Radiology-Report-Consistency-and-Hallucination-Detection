import { Home, FileText, Sparkles, Settings } from 'lucide-react';

export default function Sidebar() {
  return (
    <aside className="bg-chrome-dark w-12 flex flex-col items-center py-4 gap-4">
      <div className="text-white border-l-2 border-white p-2 cursor-pointer transition-colors">
        <Home size={20} />
      </div>
      <div className="text-white/60 hover:text-white p-2 cursor-pointer transition-colors">
        <FileText size={20} />
      </div>
      <div className="text-white/60 hover:text-white p-2 cursor-pointer transition-colors">
        <Sparkles size={20} />
      </div>
      <div className="text-white/60 hover:text-white p-2 cursor-pointer transition-colors">
        <Settings size={20} />
      </div>
    </aside>
  );
} 