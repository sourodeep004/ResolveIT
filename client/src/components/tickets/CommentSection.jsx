
import { useState } from 'react';
import { api } from '../../lib/api.js';

function formatDate(value) {
  if (!value) return 'Time unavailable';

  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function CommentSection({
  ticketId,
  comments = [],
  onCommentAdded
}) {
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();

    const text = body.trim();
    if (!text) return;

    setPosting(true);
    setError('');

    try {
      await api.post(`/tickets/${ticketId}/comments`, { body: text });
      setBody('');
      await onCommentAdded?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add comment.');
    } finally {
      setPosting(false);
    }
  }

  return (
    <section>
      <h3>Comments</h3>

      {error && <div className="error-box">{error}</div>}

      {comments.length === 0 ? (
        <p className="empty-state">No comments yet. Start the conversation below.</p>
      ) : (
        <div className="comment-list">
          {comments.map(comment => (
            <article className="panel comment-item" key={comment._id}>
              <div className="comment-heading">
                <strong>{comment.author?.name || 'Unknown user'}</strong>
                <span className="muted small">{formatDate(comment.createdAt)}</span>
              </div>
              <p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                {comment.body}
              </p>
            </article>
          ))}
        </div>
      )}

      <form className="stack" onSubmit={submit}>
        <label>
          Add a comment
          <textarea
            rows="3"
            maxLength={2000}
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Share an update or ask a question…"
          />
        </label>

        <button className="primary-btn" disabled={posting || !body.trim()}>
          {posting ? 'Posting…' : 'Add comment'}
        </button>
      </form>
    </section>
  );
}
