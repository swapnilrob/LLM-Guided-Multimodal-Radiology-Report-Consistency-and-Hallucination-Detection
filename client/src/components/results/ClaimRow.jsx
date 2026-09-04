import { useState } from 'react';
import { ChevronDown, ChevronRight, MapPin } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export default function ClaimRow({ claim, index, isSelected, onSelect }) {
  const [expanded, setExpanded] = useState(false);

  // Map the verdict from the backend to our StatusBadge status names
  const getStatus = () => {
    switch (claim.verdict) {
      case 'hallucinated': return 'hallucinated';
      case 'supported': return 'verified';
      case 'uncertain': return 'uncertain';
      default: return 'uncertain';
    }
  };

  // Format the claim ID as C-01, C-02, etc.
  const claimId = `C-${String(index + 1).padStart(2, '0')}`;

  // Toggle expand/collapse
  const handleClick = () => {
    setExpanded(!expanded);
    if (onSelect) onSelect(index);
  };

  // Get the border colour for the expanded detail panel
  const getBorderColor = () => {
    switch (claim.verdict) {
      case 'hallucinated': return 'border-l-status-hallucinated';
      case 'supported': return 'border-l-status-verified';
      case 'uncertain': return 'border-l-status-uncertain';
      default: return 'border-l-border-light';
    }
  };

  return (
    <div className={`${isSelected ? 'bg-row-selected' : ''}`}>
      {/* ── Main row ── */}
      <div
        onClick={handleClick}
        className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors
                   border-b border-border-light
                   ${isSelected ? 'bg-row-selected' : 'hover:bg-row-hover'}
                   ${isSelected ? 'border-l-[3px] border-l-accent-teal' : ''}`}
      >
        {/* Expand/collapse icon */}
        <div className="text-text-light shrink-0">
          {expanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </div>

        {/* Claim ID */}
        <span className="font-mono text-xs text-text-medium w-10 shrink-0">
          {claimId}
        </span>

        {/* Claim text */}
        <p className="flex-1 text-sm text-text-dark min-w-0">
          {claim.claimText || claim.text || claim.claim || 'No claim text'}
        </p>

        {/* Risk score */}
        {claim.riskScore !== undefined && (
          <span
            className={`text-xs font-bold shrink-0 ${
              claim.riskScore >= 70
                ? 'text-status-hallucinated'
                : claim.riskScore >= 40
                ? 'text-status-mismatch'
                : 'text-status-verified'
            }`}
          >
            {claim.riskScore}%
          </span>
        )}

        {/* Status badge */}
        <div className="shrink-0">
          <StatusBadge status={getStatus()} />
        </div>
      </div>

      {/* ── Expanded detail panel ── */}
      {expanded && (
        <div
          className={`bg-input-bg border-b border-border-light border-l-[3px] ${getBorderColor()} px-4 py-3 ml-0`}
        >
          {/* Explanation */}
          {claim.explanation && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-text-medium uppercase tracking-wide mb-1">
                Explanation
              </p>
              <p className="text-sm text-text-dark leading-relaxed">
                {claim.explanation}
              </p>
            </div>
          )}

          {/* Anatomical region */}
          {claim.anatomicalRegion && (
            <div className="flex items-center gap-1.5 text-xs text-text-medium">
              <MapPin className="w-3 h-3" />
              <span>Region: {claim.anatomicalRegion}</span>
            </div>
          )}

          {/* Bounding box info */}
          {claim.boundingBox && (
            <div className="mt-2 text-xs text-text-light">
              Bounding box: x={claim.boundingBox.x}%, y={claim.boundingBox.y}%,
              w={claim.boundingBox.width}%, h={claim.boundingBox.height}%
            </div>
          )}
        </div>
      )}
    </div>
  );
} 