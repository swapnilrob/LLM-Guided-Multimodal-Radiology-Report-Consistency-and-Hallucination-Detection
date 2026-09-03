export default function ReportComparison({ originalReport, correctedReport }) {
  return (
    <div className="space-y-4">
      {/* Original report */}
      <div>
        <p className="text-xs font-semibold text-text-medium uppercase tracking-wide mb-1.5">
          Original Report Text
        </p>
        <div className="bg-input-bg border border-border-light rounded-sm p-3 text-sm text-text-dark leading-relaxed whitespace-pre-wrap">
          {originalReport || 'No report text available.'}
        </div>
      </div>

      {/* Corrected report */}
      <div>
        <p className="text-xs font-semibold text-text-medium uppercase tracking-wide mb-1.5">
          AI Corrected Draft
        </p>
        <div className="bg-input-bg border border-border-light border-l-[3px] border-l-accent-teal rounded-sm p-3 text-sm text-text-dark leading-relaxed whitespace-pre-wrap">
          {correctedReport || 'No corrected report generated.'}
        </div>
      </div>

      {/* Action buttons */}
      <div className="space-y-2">
        <button
          className="w-full py-2.5 bg-chrome-section text-white text-xs font-semibold uppercase tracking-wider rounded
                     border-2 border-chrome-section-alt
                     hover:bg-chrome-section-alt transition-colors"
        >
          Accept Suggestion
        </button>
        <button
          className="w-full py-2.5 bg-panel text-chrome-section text-xs font-semibold uppercase tracking-wider rounded
                     border-2 border-chrome-section-alt
                     hover:bg-row-selected transition-colors"
        >
          Overrule & Edit
        </button>
        <button
          className="w-full py-2.5 bg-panel text-status-mismatch text-xs font-semibold uppercase tracking-wider rounded
                     border-2 border-status-mismatch
                     hover:bg-orange-50 transition-colors"
        >
          Mark as Valid Clinical Finding
        </button>
      </div>
    </div>
  );
} 