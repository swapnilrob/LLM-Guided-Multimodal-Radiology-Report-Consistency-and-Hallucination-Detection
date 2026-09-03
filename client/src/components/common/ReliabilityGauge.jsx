export default function ReliabilityGauge({ score }) {
  // Determine the colour based on the score range
  const getColor = () => {
    if (score <= 35) return { ring: 'text-status-hallucinated', bg: 'bg-red-50', label: 'Low' };
    if (score <= 65) return { ring: 'text-status-mismatch', bg: 'bg-orange-50', label: 'Medium' };
    return { ring: 'text-status-verified', bg: 'bg-green-50', label: 'High' };
  };

  const color = getColor();

  // SVG circle math
  // The circle has a radius of 54px, so its circumference = 2 * π * 54 ≈ 339.29
  const radius = 54;
  const circumference = 2 * Math.PI * radius;

  // How much of the circle to fill: score=0 means empty, score=100 means full
  const filled = (score / 100) * circumference;
  const gap = circumference - filled;

  return (
    <div className="flex flex-col items-center">
      {/* SVG circle gauge */}
      <div className="relative w-32 h-32">
        <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
          {/* Background circle (grey track) */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="#E0E0E0"
            strokeWidth="8"
          />

          {/* Coloured progress circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${gap}`}
            className={`${color.ring} transition-all duration-500`}
          />
        </svg>

        {/* Score number in the centre */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-bold ${color.ring}`}>
            {score}
          </span>
          <span className="text-xs text-text-medium font-medium">/ 100</span>
        </div>
      </div>

      {/* Label below */}
      <div className="mt-2 text-center">
        <p className="text-sm font-semibold text-text-dark">Report Reliability</p>
        <span
          className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-semibold ${color.bg} ${color.ring}`}
        >
          {color.label}
        </span>
      </div>
    </div>
  );
} 