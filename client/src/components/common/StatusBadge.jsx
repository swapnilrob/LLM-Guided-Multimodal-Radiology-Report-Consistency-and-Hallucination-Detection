import { Check } from 'lucide-react';

// Configuration object — maps each status to its colours and label
const STATUS_CONFIG = {
  hallucinated: {
    bg: 'bg-status-hallucinated',
    text: 'text-white',
    label: 'HALLUCINATION DETECTED',
    showCount: true,
  },
  verified: {
    bg: 'bg-status-verified',
    text: 'text-white',
    label: 'VERIFIED',
    showCount: false,
  },
  mismatch: {
    bg: 'bg-status-mismatch',
    text: 'text-white',
    label: 'MISMATCH',
    showCount: true,
  },
  uncertain: {
    bg: 'bg-status-uncertain',
    text: 'text-text-dark',
    label: 'UNCERTAIN',
    showCount: false,
  },
};

export default function StatusBadge({ status, count }) {
  // Look up the config for this status, or fall back to uncertain
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.uncertain;

  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide
                  ${config.bg} ${config.text}`}
    >
      {/* Show checkmark icon for verified */}
      {status === 'verified' && <Check className="w-3 h-3" />}

      {/* Show count in parentheses for hallucinated and mismatch */}
      {config.showCount && count !== undefined && `(${count}) `}

      {config.label}
    </span>
  );
} 