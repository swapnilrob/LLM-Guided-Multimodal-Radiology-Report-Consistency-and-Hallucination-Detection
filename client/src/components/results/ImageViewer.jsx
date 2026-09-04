import { useState } from 'react';
import { Eye, EyeOff, ZoomIn, ZoomOut } from 'lucide-react';

export default function ImageViewer({ imageUrl, claims, selectedClaim, onClaimSelect }) {
  const [showOverlays, setShowOverlays] = useState(true);
  const [hoveredBox, setHoveredBox] = useState(null);
  const [zoom, setZoom] = useState(1);

  // Filter claims that have bounding box data
  const claimsWithBoxes = (claims || []).filter(
    (c) => c.boundingBox && c.boundingBox.x !== undefined
  );

  // Get the colour for a bounding box based on verdict
  const getBoxColor = (verdict) => {
    switch (verdict) {
      case 'hallucinated': return { border: '#D32F2F', bg: 'rgba(211, 47, 47, 0.15)' };
      case 'supported': return { border: '#388E3C', bg: 'rgba(56, 142, 60, 0.15)' };
      case 'uncertain': return { border: '#FBC02D', bg: 'rgba(251, 192, 45, 0.15)' };
      default: return { border: '#9E9E9E', bg: 'rgba(158, 158, 158, 0.15)' };
    }
  };

  // Format claim ID
  const getClaimId = (index) => `C-${String(index + 1).padStart(2, '0')}`;

  return (
    <div>
      {/* ── Controls ── */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-text-medium uppercase tracking-wide">
          X-Ray Image
        </p>
        <div className="flex items-center gap-1">
          {/* Zoom controls */}
          <button
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
            className="p-1 text-text-light hover:text-text-medium transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs text-text-light w-10 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(2, z + 0.25))}
            className="p-1 text-text-light hover:text-text-medium transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          {/* Toggle overlays */}
          {claimsWithBoxes.length > 0 && (
            <button
              onClick={() => setShowOverlays(!showOverlays)}
              className={`ml-2 p-1 rounded transition-colors ${
                showOverlays ? 'text-accent-teal' : 'text-text-light hover:text-text-medium'
              }`}
              title={showOverlays ? 'Hide overlays' : 'Show overlays'}
            >
              {showOverlays ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* ── Image with overlays ── */}
      {imageUrl ? (
        <div className="relative border border-border-light rounded-sm overflow-hidden bg-black">
          {/* Scrollable/zoomable container */}
          <div className="overflow-auto max-h-[500px]">
            <div
              className="relative inline-block"
              style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
            >
              {/* The X-ray image */}
              <img
                src={imageUrl}
                alt="Chest X-ray"
                className="block w-full h-auto"
                draggable={false}
              />

              {/* Bounding box overlays */}
              {showOverlays &&
                claimsWithBoxes.map((claim, idx) => {
                  // Find the original index of this claim in the full claims array
                  const originalIndex = (claims || []).indexOf(claim);
                  const box = claim.boundingBox;
                  const colors = getBoxColor(claim.verdict);
                  const isSelected = selectedClaim === originalIndex;
                  const isHovered = hoveredBox === originalIndex;

                  return (
                    <div
                      key={originalIndex}
                      onClick={() => onClaimSelect && onClaimSelect(originalIndex)}
                      onMouseEnter={() => setHoveredBox(originalIndex)}
                      onMouseLeave={() => setHoveredBox(null)}
                      className="absolute cursor-pointer transition-opacity"
                      style={{
                        left: `${box.x}%`,
                        top: `${box.y}%`,
                        width: `${box.width}%`,
                        height: `${box.height}%`,
                        border: `2px solid ${colors.border}`,
                        backgroundColor: isSelected || isHovered ? colors.bg : 'transparent',
                        opacity: isSelected || isHovered ? 1 : 0.7,
                        zIndex: isSelected ? 10 : 1,
                      }}
                    >
                      {/* Claim ID label in the top-left corner of the box */}
                      <span
                        className="absolute -top-5 left-0 text-[10px] font-bold px-1 py-0.5 rounded-sm"
                        style={{
                          backgroundColor: colors.border,
                          color: '#FFFFFF',
                        }}
                      >
                        {getClaimId(originalIndex)}
                      </span>
                    </div>
                  );
                })}

              {/* Tooltip on hover */}
              {hoveredBox !== null && showOverlays && (() => {
                const claim = (claims || [])[hoveredBox];
                if (!claim || !claim.boundingBox) return null;
                const box = claim.boundingBox;
                const colors = getBoxColor(claim.verdict);

                return (
                  <div
                    className="absolute z-20 pointer-events-none"
                    style={{
                      left: `${box.x + box.width + 1}%`,
                      top: `${box.y}%`,
                    }}
                  >
                    <div className="bg-tooltip-bg text-tooltip-text rounded p-2.5 shadow-lg max-w-[220px]">
                      <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: colors.border }}>
                        {getClaimId(hoveredBox)} — {claim.verdict?.toUpperCase() || 'UNKNOWN'}
                      </p>
                      <p className="text-xs leading-relaxed">
                        {claim.claimText || claim.text || claim.claim || 'No claim text'}
                      </p>
                      {claim.anatomicalRegion && (
                        <p className="text-[10px] text-tooltip-text/70 mt-1">
                          Region: {claim.anatomicalRegion}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Legend */}
          {claimsWithBoxes.length > 0 && showOverlays && (
            <div className="absolute bottom-2 left-2 flex items-center gap-3 bg-black/70 rounded px-2 py-1">
              <span className="flex items-center gap-1 text-[10px] text-white">
                <span className="w-2 h-2 rounded-sm bg-status-hallucinated" /> Hallucinated
              </span>
              <span className="flex items-center gap-1 text-[10px] text-white">
                <span className="w-2 h-2 rounded-sm bg-status-verified" /> Supported
              </span>
              <span className="flex items-center gap-1 text-[10px] text-white">
                <span className="w-2 h-2 rounded-sm bg-status-uncertain" /> Uncertain
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="border border-border-light rounded-sm bg-input-bg h-48 flex items-center justify-center">
          <p className="text-xs text-text-light">No image available</p>
        </div>
      )}
    </div>
  );
} 