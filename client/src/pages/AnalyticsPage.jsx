import { useState, useEffect, useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  FileText,
  Activity,
  AlertTriangle,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAnalyses } from '../api/analysisApi';
import Layout from '../components/layout/Layout';
import SectionHeader from '../components/common/SectionHeader';

// Pie chart colours
const PIE_COLORS = {
  supported: '#388E3C',
  hallucinated: '#D32F2F',
  uncertain: '#FBC02D',
};

export default function AnalyticsPage() {
  const { token, logout } = useAuth();

  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Fetch analyses ──
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAnalyses(token);
        const list = data.analyses || data || [];
        setAnalyses(list);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
        if (err.response?.status === 401) {
          logout();
        }
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchData();
  }, [token, logout]);

  // ── Computed stats ──
  const completed = analyses.filter((a) => a.status === 'complete');

  const totalAnalyses = analyses.length;

  const averageScore = useMemo(() => {
    if (completed.length === 0) return 0;
    return Math.round(
      completed.reduce((sum, a) => sum + (a.reliabilityScore || 0), 0) / completed.length
    );
  }, [completed]);

  const totalClaims = useMemo(() => {
    return completed.reduce((sum, a) => sum + (a.claims?.length || 0), 0);
  }, [completed]);

  const totalHallucinations = useMemo(() => {
    return completed.reduce((sum, a) => {
      return sum + (a.claims?.filter((c) => c.verdict === 'hallucinated').length || 0);
    }, 0);
  }, [completed]);

  // ── Reliability score over time (line chart data) ──
  const scoreOverTime = useMemo(() => {
    return completed
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .map((a, index) => ({
        name: `#${index + 1}`,
        score: a.reliabilityScore || 0,
        date: new Date(a.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
      }));
  }, [completed]);

  // ── Verdict breakdown (pie chart data) ──
  const verdictBreakdown = useMemo(() => {
    let supported = 0;
    let hallucinated = 0;
    let uncertain = 0;

    completed.forEach((a) => {
      (a.claims || []).forEach((c) => {
        if (c.verdict === 'supported') supported++;
        else if (c.verdict === 'hallucinated') hallucinated++;
        else uncertain++;
      });
    });

    const data = [];
    if (supported > 0) data.push({ name: 'Supported', value: supported, color: PIE_COLORS.supported });
    if (hallucinated > 0) data.push({ name: 'Hallucinated', value: hallucinated, color: PIE_COLORS.hallucinated });
    if (uncertain > 0) data.push({ name: 'Uncertain', value: uncertain, color: PIE_COLORS.uncertain });

    return data;
  }, [completed]);

  // ── Score distribution (bar chart data) ──
  const scoreDistribution = useMemo(() => {
    const buckets = [
      { range: '0-20', min: 0, max: 20, count: 0 },
      { range: '21-40', min: 21, max: 40, count: 0 },
      { range: '41-60', min: 41, max: 60, count: 0 },
      { range: '61-80', min: 61, max: 80, count: 0 },
      { range: '81-100', min: 81, max: 100, count: 0 },
    ];

    completed.forEach((a) => {
      const score = a.reliabilityScore || 0;
      const bucket = buckets.find((b) => score >= b.min && score <= b.max);
      if (bucket) bucket.count++;
    });

    return buckets.map((b) => ({ name: b.range, count: b.count }));
  }, [completed]);

  // ── Bar colour based on score range ──
  const getBarColor = (name) => {
    if (name === '0-20' || name === '21-40') return '#D32F2F';
    if (name === '41-60') return '#EF6C00';
    return '#388E3C';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-6 h-6 text-accent-teal animate-spin" />
          <span className="ml-2 text-sm text-text-medium">Loading analytics...</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-4">
        {/* ── Page Header ── */}
        <div>
          <h1 className="text-xl font-bold text-text-dark">Analytics</h1>
          <p className="text-sm text-text-medium mt-0.5">
            Your usage statistics and report quality trends
          </p>
        </div>

        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-panel p-4 rounded border border-border-light border-t-[3px] border-t-accent-teal">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-medium font-medium">Total Analyses</span>
              <FileText className="w-4 h-4 text-accent-teal" />
            </div>
            <p className="text-2xl font-bold text-text-dark">{totalAnalyses}</p>
          </div>

          <div className="bg-panel p-4 rounded border border-border-light border-t-[3px] border-t-accent-teal">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-medium font-medium">Average Score</span>
              <Activity className="w-4 h-4 text-accent-teal" />
            </div>
            <p className="text-2xl font-bold text-text-dark">
              {averageScore}<span className="text-sm font-normal text-text-light"> / 100</span>
            </p>
          </div>

          <div className="bg-panel p-4 rounded border border-border-light border-t-[3px] border-t-accent-teal">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-medium font-medium">Total Claims</span>
              <TrendingUp className="w-4 h-4 text-accent-teal" />
            </div>
            <p className="text-2xl font-bold text-text-dark">{totalClaims}</p>
          </div>

          <div className="bg-panel p-4 rounded border border-border-light border-t-[3px] border-t-status-hallucinated">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-medium font-medium">Hallucinations</span>
              <AlertTriangle className="w-4 h-4 text-status-hallucinated" />
            </div>
            <p className="text-2xl font-bold text-text-dark">{totalHallucinations}</p>
          </div>
        </div>

        {/* ── Charts Row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

          {/* Reliability Score Over Time */}
          <div className="bg-panel rounded border border-border-light overflow-hidden">
            <SectionHeader number="1" title="RELIABILITY SCORE TREND" />
            <div className="p-4">
              {scoreOverTime.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={scoreOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: '#9E9E9E' }}
                      axisLine={{ stroke: '#E0E0E0' }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: '#9E9E9E' }}
                      axisLine={{ stroke: '#E0E0E0' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#263238',
                        border: 'none',
                        borderRadius: '4px',
                        color: '#ECEFF1',
                        fontSize: '12px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#00838F"
                      strokeWidth={2}
                      dot={{ fill: '#00838F', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center">
                  <p className="text-sm text-text-light">No data yet. Run some analyses to see trends.</p>
                </div>
              )}
            </div>
          </div>

          {/* Verdict Breakdown */}
          <div className="bg-panel rounded border border-border-light overflow-hidden">
            <SectionHeader number="2" title="CLAIM VERDICT BREAKDOWN" />
            <div className="p-4">
              {verdictBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={verdictBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {verdictBreakdown.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#263238',
                        border: 'none',
                        borderRadius: '4px',
                        color: '#ECEFF1',
                        fontSize: '12px',
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center">
                  <p className="text-sm text-text-light">No claims data yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Score Distribution */}
        <div className="bg-panel rounded border border-border-light overflow-hidden">
          <SectionHeader number="3" title="SCORE DISTRIBUTION" />
          <div className="p-4">
            {completed.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={scoreDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#9E9E9E' }}
                    axisLine={{ stroke: '#E0E0E0' }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#9E9E9E' }}
                    axisLine={{ stroke: '#E0E0E0' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#263238',
                      border: 'none',
                      borderRadius: '4px',
                      color: '#ECEFF1',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {scoreDistribution.map((entry, index) => (
                      <Cell key={index} fill={getBarColor(entry.name)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center">
                <p className="text-sm text-text-light">No data yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
} 