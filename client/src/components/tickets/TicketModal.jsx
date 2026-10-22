
import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import SlaBadge from './SlaBadge.jsx';
import { formatDeadline } from '../../utils/sla.js';
import CommentSection from './CommentSection.jsx';

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

function readableDetails(entry, ticket) {
  const details = entry?.details || '';

  const assignment = details.match(/^assignedTo:\s*(.*?)\s*->\s*(.*?)$/i);
  if (assignment) {
    const current = ticket?.assignedTo;
    const currentId = current?._id || current;
    const nameFor = value => {
      const id = (value || '').trim();

      if (!id || id === 'null' || id.toLowerCase() === 'none') {
        return 'Unassigned';
      }

      if (currentId && String(currentId) === id) {
        return current?.name || 'Assigned user';
      }

      return `User ending ${id.slice(-6)}`;
    };

    return `Assigned to ${nameFor(assignment[2])} (previously ${nameFor(assignment[1])})`;
  }

  const status = details.match(/^status:\s*(.*?)\s*->\s*(.*?)$/i);
  if (status) return `Status changed from ${status[1]} to ${status[2]}`;

  const priority = details.match(/^priority:\s*(.*?)\s*->\s*(.*?)$/i);
  if (priority) return `Priority changed from ${priority[1]} to ${priority[2]}`;

  return details || 'No additional details.';
}

export default function TicketModal({ ticketId, onClose, onChanged }) {
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const { data } = await api.get(`/tickets/${ticketId}`);
      setTicket(data.data);
      setComments(Array.isArray(data.comments) ? data.comments : []);
      setHistory(Array.isArray(data.history) ? data.history : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load ticket details.');
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div
      className="modal-backdrop"
      onMouseDown={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ticket-modal-title"
        style={{ width: 'min(760px, 96vw)', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div className="modal-head">
          <div>
            <p className="eyebrow">TICKET ACTIVITY</p>
            <h2 id="ticket-modal-title">{ticket?.title || 'Ticket details'}</h2>
            {ticket && (
              <p className="muted small">
                Ticket #{ticket._id.slice(-6).toUpperCase()}
              </p>
            )}
          </div>
          <button className="icon-btn close-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {error && <div className="error-box">{error}</div>}

        {loading && !ticket ? (
          <p className="empty-state">Loading ticket details…</p>
        ) : ticket ? (
          <>
            <div className="panel ticket-detail-summary">
              <div className="ticket-detail-badges">
                <span className={`status ${ticket.status?.toLowerCase().replace(' ', '-')}`}>
                  {ticket.status}
                </span>
                <span className={`priority ${ticket.priority?.toLowerCase()}`}>
                  <i />{ticket.priority}
                </span>
                <SlaBadge ticket={ticket} />
              </div>

              <p className="muted small">
                Created by {ticket.createdBy?.name || 'Unknown'} · {formatDate(ticket.createdAt)}
              </p>
              <p className="muted small">
                Assigned to {ticket.assignedTo?.name || 'Unassigned'}
              </p>
              <p className="muted small">SLA deadline: {formatDeadline(ticket.dueAt)}</p>

              <h3>Description</h3>
              <p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                {ticket.description}
              </p>
            </div>

            <section className="activity-section">
              <h3>Activity history</h3>
              <p className="muted small">Recorded changes and actions for this ticket.</p>

              {history.length === 0 ? (
                <p className="empty-state">No activity recorded yet.</p>
              ) : (
                <div className="activity-list">
                  {history.map(item => (
                    <article className="panel activity-item" key={item._id}>
                      <div className="activity-heading">
                        <strong>{item.action}</strong>
                        <span className="muted small">{formatDate(item.createdAt)}</span>
                      </div>
                      <p>{readableDetails(item, ticket)}</p>
                      <p className="muted small">
                        By {item.actor?.name || 'Unknown user'}
                        {item.actor?.role ? ` · ${item.actor.role}` : ''}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <CommentSection
              ticketId={ticketId}
              comments={comments}
              onCommentAdded={async () => {
                await load();
                onChanged?.();
              }}
            />
          </>
        ) : (
          <p className="empty-state">Ticket details are unavailable.</p>
        )}
      </section>
    </div>
  );
}
