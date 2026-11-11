import { useState } from 'react';
import { ChevronDown, ChevronRight, MapPin, ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import { submitFeedback } from '../../api/collaborationApi';

export default function ClaimRow({ claim, index, isSelected, onSelect, analysisId, userFeedback }) {
  const [expanded, setExpanded] = useState(false);
  const [feedbackState, setFeedbackState] = useState(userFeedback || null); // 'thumbs_up' | 'thumbs_down' | null
  const [correctionText, setCorrectionText] = useState('');
  const [showCorrectionInput, setShowCorrectionInput] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const getStatus = () => {
    switch (claim.verdict) {
      case 'hallucinated': return 'hallucinated';
      case 'supported': return 'verified';
      case 'uncertain': return 'uncertain';
      default: return 'uncertain';
    }
  };

  const claimId = `C-${String(index + 1).padStart(2, '0')}`;

  const handleClick = () => {
    setExpanded(!expanded);
    if (onSelect) onSelect(index);
  };

  const getBorderColor = () => {
    switch (claim.verdict) {
      case 'hallucinated': return 'border-l-status-hallucinated';
      case 'supported': return 'border-l-status-verified';
      case 'uncertain': return 'border-l-status-uncertain';
      default: return 'border-l-border-light';
    }
  };

  const handleFeedback = async (verdict) => {
    if (!analysisId || !claim._id) return;
    setFeedbackLoading(true);
    try {
      await submitFeedback({
        analysisId,
        claimId: claim._id,
        verdict,
        correctionText: verdict === 'thumbs_down' ? correctionText : undefined,
      });
      setFeedbackState(verdict);
      if (verdict === 'thumbs_down') {
        setShowCorrectionInput(true);
      } else {
        setShowCorrectionInput(false);
      }
    } catch (err) {
      console.error('Feedback error:', err);
    } finally {
      setFeedbackLoading(false);
    }
  };

  const handleCorrectionSubmit = async () => {
    if (!correctionText.trim()) return;
    setFeedbackLoading(true);
    try {
      await submitFeedback({
        analysisId,
        claimId: claim._id,
        verdict: 'thumbs_down',
        correctionText,
      });
    } catch (err) {
      console.error('Correction error:', err);
    } finally {
      setFeedbackLoading(false);
    }
  };

  return (
    <div className={`${isSelected ? 'bg-row-selected' : ''}`}>
      {/* Main row */}
      <div
        onClick={handleClick}
        className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors
                   border-b border-border-light
                   ${isSelected ? 'bg-row-selected' : 'hover:bg-row-hover'}
                   ${isSelected ? 'border-l-[3px] border-l-accent-teal' : ''}`}
      >
        <div className="text-text-light shrink-0">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </div>

        <span className="font-mono text-xs text-text-medium w-10 shrink-0">{claimId}</span>

        <p className="flex-1 text-sm text-text-dark min-w-0">
          {claim.claimText || claim.text || claim.claim || 'No claim text'}
        </p>

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

        <div className="shrink-0">
          <StatusBadge status={getStatus()} />
        </div>
      </div>

      {/* Expanded detail panel */}
      {expanded && (
        <div className={`bg-input-bg border-b border-border-light border-l-[3px] ${getBorderColor()} px-4 py-3 ml-0`}>
          {claim.explanation && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-text-medium uppercase tracking-wide mb-1">Explanation</p>
              <p className="text-sm text-text-dark leading-relaxed">{claim.explanation}</p>
            </div>
          )}

          {claim.anatomicalRegion && (
            <div className="flex items-center gap-1.5 text-xs text-text-medium">
              <MapPin className="w-3 h-3" />
              <span>Region: {claim.anatomicalRegion}</span>
            </div>
          )}

          {claim.boundingBox && (
            <div className="mt-2 text-xs text-text-light">
              Bounding box: x={claim.boundingBox.x}%, y={claim.boundingBox.y}%,
              w={claim.boundingBox.width}%, h={claim.boundingBox.height}%
            </div>
          )}

          {/* F44 — Feedback buttons */}
          {analysisId && claim._id && (
            <div className="mt-3 pt-3 border-t border-border-light">
              <p className="text-xs font-semibold text-text-medium uppercase tracking-wide mb-2">
                Rate AI Verdict
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); handleFeedback('thumbs_up'); }}
                  disabled={feedbackLoading}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border transition-colors ${
                    feedbackState === 'thumbs_up'
                      ? 'bg-status-verified text-white border-status-verified'
                      : 'bg-panel text-text-medium border-border-light hover:border-status-verified hover:text-status-verified'
                  }`}
                >
                  {feedbackLoading && feedbackState !== 'thumbs_up' ? null : <ThumbsUp className="w-3 h-3" />}
                  Agree
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (feedbackState === 'thumbs_down') {
                      setShowCorrectionInput(!showCorrectionInput);
                    } else {
                      handleFeedback('thumbs_down');
                    }
                  }}
                  disabled={feedbackLoading}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border transition-colors ${
                    feedbackState === 'thumbs_down'
                      ? 'bg-status-hallucinated text-white border-status-hallucinated'
                      : 'bg-panel text-text-medium border-border-light hover:border-status-hallucinated hover:text-status-hallucinated'
                  }`}
                >
                  <ThumbsDown className="w-3 h-3" />
                  Disagree
                </button>
                {feedbackLoading && <Loader2 className="w-3.5 h-3.5 text-text-light animate-spin" />}
              </div>

              {/* Correction text input — shows when thumbs_down */}
              {showCorrectionInput && feedbackState === 'thumbs_down' && (
                <div className="mt-2">
                  <textarea
                    value={correctionText}
                    onChange={(e) => setCorrectionText(e.target.value)}
                    placeholder="Provide your correction or reasoning..."
                    rows={2}
                    className="w-full px-3 py-2 text-xs border border-border-light rounded bg-panel text-text-dark placeholder-text-light focus:outline-none focus:border-border-focus resize-none"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); handleCorrectionSubmit(); }}
                    disabled={!correctionText.trim() || feedbackLoading}
                    className="mt-1 px-3 py-1.5 text-xs font-medium bg-chrome-section text-white rounded hover:bg-chrome-section-alt transition-colors disabled:opacity-50"
                  >
                    Submit Correction
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}