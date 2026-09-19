import { useState } from 'react';
import { Download, BarChart3, AlertTriangle } from 'lucide-react';
import { getResearchExport } from '../../api/adminApi';

export default function ResearchExport() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg]         = useState('');
  const [isError, setIsError] = useState(false);
  const [preview, setPreview] = useState(null);
  const [format, setFormat]   = useState('csv');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');

  const showMsg = (text, error = false) => {
    setMsg(text); setIsError(error);
    setTimeout(() => setMsg(''), 4000);
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const res = await getResearchExport({ format, dateFrom, dateTo });
      const data = res.data.data;
      setPreview(data);

      if (format === 'csv') {
        const header = 'Date,Total Analyses,Avg Reliability Score,Hallucinations Detected,Consistency Violations\n';
        const rows = (data.byDate ?? []).map((d) =>
          `${d.date},${d.totalAnalyses},${d.avgScore},${d.hallucinationsDetected},${d.consistencyViolations}`
        ).join('\n');
        const blob = new Blob([header + rows], { type: 'text/csv' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `research-analytics-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `research-analytics-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }

      showMsg(`Exported successfully as ${format.toUpperCase()}.`);
    } catch {
      showMsg('Failed to export data.', true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="bg-chrome-section px-4 py-2">
        <span className="text-white text-xs font-semibold uppercase tracking-wide">
          F39 — Research Analytics Export
        </span>
      </div>

      {msg && (
        <div className={`flex items-center gap-3 px-4 py-2 border text-sm ${isError ? 'bg-panel border-red-500 text-red-600' : 'bg-row-selected border-accent-teal text-text-dark'}`}>
          {isError ? <AlertTriangle className="w-4 h-4" /> : <BarChart3 className="w-4 h-4" />}
          {msg}
        </div>
      )}

      <div className="bg-panel border border-border-light p-5 space-y-4">
        <div className="bg-chrome-section px-3 py-1.5">
          <span className="text-white text-xs font-semibold uppercase tracking-wide">Export Settings</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-text-medium uppercase tracking-wide mb-1">Format</label>
            <select value={format} onChange={(e) => setFormat(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border-light bg-input text-text-dark focus:outline-none focus:border-border-focus">
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-medium uppercase tracking-wide mb-1">Date From</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border-light bg-input text-text-dark focus:outline-none focus:border-border-focus" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-medium uppercase tracking-wide mb-1">Date To</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border-light bg-input text-text-dark focus:outline-none focus:border-border-focus" />
          </div>
        </div>

        <div className="bg-input border border-border-light p-4 text-xs text-text-medium">
          <strong className="text-text-dark">Privacy note:</strong> All exported data is fully anonymised.
          No personally identifiable information (names, emails, IDs) is included in the export.
          Data is aggregated at the date level only.
        </div>

        <div className="flex justify-end">
          <button onClick={handleExport} disabled={loading}
            className="flex items-center gap-2 px-6 py-2 text-xs font-semibold uppercase tracking-wide bg-chrome-section text-white hover:opacity-90 transition-opacity disabled:opacity-50">
            <Download className="w-3.5 h-3.5" />
            {loading ? 'Exporting...' : `Export as ${format.toUpperCase()}`}
          </button>
        </div>
      </div>

      {/* Preview */}
      {preview && (
        <div className="bg-panel border border-border-light p-4 space-y-3">
          <div className="bg-chrome-section px-3 py-1.5">
            <span className="text-white text-xs font-semibold uppercase tracking-wide">Export Preview</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Analyses', value: preview.summary?.totalAnalyses ?? 0 },
              { label: 'Avg Score', value: `${preview.summary?.avgReliabilityScore ?? 0}/100` },
              { label: 'Hallucinations', value: preview.summary?.totalHallucinations ?? 0 },
              { label: 'Violations', value: preview.summary?.totalConsistencyViolations ?? 0 },
            ].map(({ label, value }) => (
              <div key={label} className="bg-input border border-border-light p-3 text-center">
                <div className="text-xs text-text-medium uppercase tracking-wide mb-1">{label}</div>
                <div className="text-xl font-bold text-text-dark">{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
