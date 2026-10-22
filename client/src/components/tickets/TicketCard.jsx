
import SlaBadge from './SlaBadge.jsx';
import { formatDeadline } from '../../utils/sla.js';

export default function TicketCard({ ticket, onView }) {
  return (
    <article className="panel ticket-card">
      <div className="ticket-card-header">
        <span className="ticket-id">
          #{ticket._id?.slice(-6).toUpperCase()}
        </span>
        <SlaBadge ticket={ticket} />
      </div>

      <h3>{ticket.title}</h3>
      <p className="muted">{ticket.category} · {ticket.priority}</p>

      <p>
        <span className={`status ${ticket.status?.toLowerCase().replace(' ', '-')}`}>
          {ticket.status}
        </span>
      </p>

      <p className="muted small">
        Deadline: {formatDeadline(ticket.dueAt)}
      </p>

      <button className="text-btn" onClick={() => onView(ticket)}>
        View details →
      </button>
    </article>
  );
}
