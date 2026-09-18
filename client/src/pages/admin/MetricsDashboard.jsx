import { useState, useEffect } from 'react';
import { Users, Activity, BarChart3, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { getSystemMetrics } from '../../api/adminApi';

// ── Single metric card ──────────────────────────────────────
function MetricCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-panel border border-border-light p-4" style={{ borderTop: `3px solid ${color}` }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-text-medium uppercase tracking-wide">{label}</span>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div className="text-2xl font-bold text-text-dark">{value ?? '—'}</div>
      {sub && <div className="text-xs text-text-light mt-1">{sub}</div>}
    </div>
  );
}

export default function MetricsDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchMetrics = async () => {
    try {
      const res = await getSystemMetrics();
      setMetrics(res.data.data);
      setLastUpdated(new Date());
      setError('');
    } catch {
      setError('Could not load metrics. Make sure you are logged in as admin.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount, then every 30 seconds
  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-panel border border-border-light p-8 text-center text-text-medium text-sm">
        Loading metrics...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-panel border border-border-light p-6 flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-status-hallucinated flex-shrink-0" />
        <span className="text-sm text-text-dark">{error}</span>
      </div>
    );
  }

  const cards = [
    {
      icon: Users,
      label: 'Total Users',
      value: metrics?.totalUsers,
      sub: `${metrics?.activeToday ?? 0} active today`,
      color: '#00838F',
    },
    {
      icon: Activity,
      label: 'Analyses Today',
      value: metrics?.analysesToday,
      sub: `${metrics?.totalAnalyses ?? 0} all time`,
      color: '#388E3C',
    },
    {
      icon: BarChart3,
      label: 'Avg Reliability Score',
      value: metrics?.avgReliabilityScore != null
        ? `${metrics.avgReliabilityScore}/100`
        : '—',
      sub: 'Across all analyses',
      color: '#EF6C00',
    },
    {
      icon: CheckCircle,
      label: 'Active Sessions',
      value: metrics?.activeSessions,
      sub: 'Currently logged in',
      color: '#00695C',
    },
  ];

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="bg-chrome-section px-4 py-2">
        <span className="text-white text-xs font-semibold uppercase tracking-wide">
          F32 — Real-Time System Metrics
        </span>
      </div>

      {/* Last updated */}
      {lastUpdated && (
        <div className="flex items-center gap-1.5 text-xs text-text-light px-1">
          <Clock className="w-3 h-3" />
          Last updated: {lastUpdated.toLocaleTimeString()} · auto-refreshes every 30s
        </div>
      )}

      {/* Metric cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((card) => (
          <MetricCard key={card.label} {...card} />
        ))}
      </div>

      {/* Server health */}
      <div className="bg-chrome-section px-4 py-2 mt-4">
        <span className="text-white text-xs font-semibold uppercase tracking-wide">
          Server Health
        </span>
      </div>
      <div className="bg-panel border border-border-light p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-text-medium uppercase tracking-wide mb-1">Status</div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-status-verified inline-block" />
              <span className="text-sm font-semibold text-text-dark">
                {metrics?.serverStatus ?? 'Online'}
              </span>
            </div>
          </div>
          <div>
            <div className="text-xs text-text-medium uppercase tracking-wide mb-1">Node Version</div>
            <div className="text-sm font-semibold text-text-dark">
              {metrics?.nodeVersion ?? 'v20+'}
            </div>
          </div>
          <div>
            <div className="text-xs text-text-medium uppercase tracking-wide mb-1">Uptime</div>
            <div className="text-sm font-semibold text-text-dark">
              {metrics?.uptime ?? '—'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
