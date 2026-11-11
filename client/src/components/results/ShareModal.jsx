import { useState } from 'react';
import { X, Copy, Check, Link, Loader2 } from 'lucide-react';
import { shareAnalysis } from '../../api/collaborationApi';

export default function ShareModal({ analysisId, onClose }) {
  const [email, setEmail] = useState('');
  const [accessLevel, setAccessLevel] = useState('view');
  const [expiryDays, setExpiryDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);

  const handleShare = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setShareLink('');

    try {
      const result = await shareAnalysis({
        analysisId,
        sharedWithEmail: email || undefined,
        accessLevel,
        expiryDays,
      });
      setShareLink(result.share.shareLink);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create share link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const input = document.createElement('input');
      input.value = shareLink;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-panel border border-border-light rounded w-full max-w-md mx-4 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-light">
          <h3 className="text-sm font-bold text-text-dark">Share Analysis</h3>
          <button onClick={onClose} className="text-text-light hover:text-text-dark">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleShare} className="p-4 space-y-4">
          {/* Email (optional) */}
          <div>
            <label className="block text-xs font-semibold text-text-medium uppercase tracking-wide mb-1">
              Share with user (optional)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@hospital.org"
              className="w-full px-3 py-2 text-sm border border-border-light rounded bg-input-bg text-text-dark placeholder-text-light focus:outline-none focus:border-border-focus"
            />
            <p className="text-xs text-text-light mt-1">Leave empty to create a public link</p>
          </div>

          {/* Access level */}
          <div>
            <label className="block text-xs font-semibold text-text-medium uppercase tracking-wide mb-1">
              Access Level
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAccessLevel('view')}
                className={`flex-1 px-3 py-2 text-xs font-medium rounded border transition-colors ${
                  accessLevel === 'view'
                    ? 'bg-accent-teal text-white border-accent-teal'
                    : 'bg-panel text-text-medium border-border-light hover:border-accent-teal'
                }`}
              >
                View Only
              </button>
              <button
                type="button"
                onClick={() => setAccessLevel('comment')}
                className={`flex-1 px-3 py-2 text-xs font-medium rounded border transition-colors ${
                  accessLevel === 'comment'
                    ? 'bg-accent-teal text-white border-accent-teal'
                    : 'bg-panel text-text-medium border-border-light hover:border-accent-teal'
                }`}
              >
                View & Comment
              </button>
            </div>
          </div>

          {/* Expiry */}
          <div>
            <label className="block text-xs font-semibold text-text-medium uppercase tracking-wide mb-1">
              Expires In
            </label>
            <select
              value={expiryDays}
              onChange={(e) => setExpiryDays(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-border-light rounded bg-input-bg text-text-dark focus:outline-none focus:border-border-focus"
            >
              <option value={1}>24 hours</option>
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
            </select>
          </div>

          {error && <p className="text-xs text-status-hallucinated">{error}</p>}

          {/* Generated link */}
          {shareLink && (
            <div className="p-3 bg-row-selected border border-accent-teal-light rounded">
              <p className="text-xs font-semibold text-text-medium mb-2 flex items-center gap-1">
                <Link className="w-3 h-3" /> Share Link Generated
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareLink}
                  className="flex-1 px-2 py-1.5 text-xs border border-border-light rounded bg-panel text-text-dark"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3 py-1.5 text-xs font-medium bg-accent-teal text-white rounded hover:bg-chrome-section-alt transition-colors flex items-center gap-1"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          )}

          {/* Submit button */}
          {!shareLink && (
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-xs font-semibold uppercase tracking-wider bg-chrome-section text-white rounded hover:bg-chrome-section-alt transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Generate Share Link
            </button>
          )}
        </form>
      </div>
    </div>
  );
}