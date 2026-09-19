import { useState } from 'react';
import { BarChart3, Users, ScrollText, Megaphone, Settings, HardDrive, MessageSquare, Download } from 'lucide-react';
import Layout from '../components/layout/Layout';
import MetricsDashboard from './admin/MetricsDashboard';
import UserManagement from './admin/UserManagement';
import AuditLogViewer from './admin/AuditLogViewer';
import AnnouncementBroadcaster from './admin/AnnouncementBroadcaster';
import ModelConfig from './admin/ModelConfig';
import QuotaManagement from './admin/QuotaManagement';
import FeedbackInbox from './admin/FeedbackInbox';
import ResearchExport from './admin/ResearchExport';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const tabs = [
  { id: 'metrics',       label: 'SYSTEM METRICS',   icon: BarChart3      },
  { id: 'users',         label: 'USER MANAGEMENT',  icon: Users          },
  { id: 'audit',         label: 'AUDIT LOGS',        icon: ScrollText     },
  { id: 'announcements', label: 'ANNOUNCEMENTS',     icon: Megaphone      },
  { id: 'model',         label: 'MODEL CONFIG',      icon: Settings       },
  { id: 'quota',         label: 'STORAGE & QUOTA',   icon: HardDrive      },
  { id: 'feedback',      label: 'FEEDBACK INBOX',    icon: MessageSquare  },
  { id: 'export',        label: 'RESEARCH EXPORT',   icon: Download       },
];

export default function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('metrics');

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <Layout>
      <div className="bg-chrome-section px-4 py-2 mb-3 flex items-center gap-2">
        <span className="text-white font-semibold text-sm tracking-wide uppercase">
          Admin Panel
        </span>
      </div>

      <div className="bg-panel border border-border-light mb-3 flex overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold tracking-wide
                        whitespace-nowrap border-b-2 transition-colors
                        ${activeTab === tab.id
                          ? 'border-accent-teal text-accent-teal bg-white'
                          : 'border-transparent text-text-medium hover:text-text-dark hover:bg-row-hover'
                        }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'metrics'       && <MetricsDashboard />}
        {activeTab === 'users'         && <UserManagement />}
        {activeTab === 'audit'         && <AuditLogViewer />}
        {activeTab === 'announcements' && <AnnouncementBroadcaster />}
        {activeTab === 'model'         && <ModelConfig />}
        {activeTab === 'quota'         && <QuotaManagement />}
        {activeTab === 'feedback'      && <FeedbackInbox />}
        {activeTab === 'export'        && <ResearchExport />}
      </div>
    </Layout>
  );
}