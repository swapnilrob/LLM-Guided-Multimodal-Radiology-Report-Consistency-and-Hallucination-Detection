import { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, Send, Reply, Trash2, Loader2, X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { createComment, getComments, deleteComment } from '../../api/commentApi';
import { connectSocket, disconnectSocket } from '../../utils/socket';

export default function CommentPanel({ analysisId, claimId, onClose }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const data = await getComments(analysisId);
        let filtered = data.comments || [];
        if (claimId) {
          filtered = filtered.filter((c) => c.claimId === claimId || c.claimId === null);
        }
        setComments(filtered);
      } catch {
        setComments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();

    // Connect socket and join room
    const socket = connectSocket();
    socket.emit('join_analysis', analysisId);

    socket.on('new_comment', (comment) => {
      if (!claimId || comment.claimId === claimId || comment.claimId === null) {
        setComments((prev) => [...prev, comment]);
      }
    });

    socket.on('delete_comment', ({ commentId }) => {
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    });

    return () => {
      socket.emit('leave_analysis', analysisId);
      socket.off('new_comment');
      socket.off('delete_comment');
    };
  }, [analysisId, claimId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    try {
      await createComment({
        analysisId,
        claimId: claimId || null,
        text: text.trim(),
        parentComment: replyTo?._id || null,
      });
      setText('');
      setReplyTo(null);
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await deleteComment(commentId);
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  // Build threaded structure
  const topLevel = comments.filter((c) => !c.parentComment);
  const replies = comments.filter((c) => c.parentComment);

  const getReplies = (parentId) =>
    replies.filter((r) => (r.parentComment?._id || r.parentComment) === parentId);

  const renderComment = (comment, isReply = false) => {
    const isOwn = (comment.author?._id || comment.author) === user?._id;
    const childReplies = getReplies(comment._id);

    return (
      <div key={comment._id} className={`${isReply ? 'ml-6 border-l-2 border-border-light pl-3' : ''}`}>
        <div className="group py-2">
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-full bg-chrome-section flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">
                {(comment.author?.fullName || '?').charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-text-dark">
                  {comment.author?.fullName || 'Unknown'}
                </span>
                <span className="text-xs text-text-light">
                  {new Date(comment.createdAt).toLocaleString('en-US', {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              </div>
              <p className="text-sm text-text-dark mt-0.5 leading-relaxed">{comment.text}</p>
              <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setReplyTo(comment)}
                  className="flex items-center gap-1 text-xs text-text-light hover:text-accent-teal transition-colors"
                >
                  <Reply className="w-3 h-3" />
                  Reply
                </button>
                {isOwn && (
                  <button
                    onClick={() => handleDelete(comment._id)}
                    className="flex items-center gap-1 text-xs text-text-light hover:text-status-hallucinated transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        {childReplies.map((r) => renderComment(r, true))}
      </div>
    );
  };

  return (
    <div className="bg-panel border border-border-light rounded overflow-hidden flex flex-col h-full max-h-[500px]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border-light bg-input-bg">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-accent-teal" />
          <span className="text-xs font-semibold text-text-dark uppercase tracking-wide">
            Comments{claimId ? ` — Claim` : ''}
          </span>
          <span className="text-xs text-text-light">({comments.length})</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-text-light hover:text-text-dark">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Comment list */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 text-accent-teal animate-spin" />
          </div>
        ) : topLevel.length === 0 ? (
          <p className="text-xs text-text-light text-center py-6">No comments yet. Start the discussion.</p>
        ) : (
          topLevel.map((c) => renderComment(c))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Reply indicator */}
      {replyTo && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-row-selected border-t border-border-light">
          <Reply className="w-3 h-3 text-accent-teal" />
          <span className="text-xs text-text-medium">
            Replying to {replyTo.author?.fullName || 'Unknown'}
          </span>
          <button onClick={() => setReplyTo(null)} className="ml-auto text-text-light hover:text-text-dark">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 px-3 py-2.5 border-t border-border-light">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a comment..."
          className="flex-1 px-3 py-1.5 text-sm border border-border-light rounded bg-input-bg text-text-dark placeholder-text-light focus:outline-none focus:border-border-focus"
        />
        <button
          type="submit"
          disabled={!text.trim() || submitting}
          className="p-2 bg-chrome-section text-white rounded hover:bg-chrome-section-alt transition-colors disabled:opacity-50"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
}