
import { CheckCheck, Ticket } from 'lucide-react';

export default function HelpCenter({ onCreateTicket, onViewTickets }) {
  return (
    <>
      <div className="welcome-row">
        <div>
          <p className="eyebrow">SUPPORT RESOURCES</p>
          <h1>Help center</h1>
          <p className="muted">Find the support you need to get back to work.</p>
        </div>
      </div>

      <div className="help-grid">
        <div className="panel help-panel">
          <div className="stat-icon blue"><Ticket size={20} /></div>
          <h3>Raise an IT request</h3>
          <p className="muted">
            Describe the issue, add details, and choose a priority.
          </p>
          <button className="secondary-btn" onClick={onCreateTicket}>
            Create a ticket →
          </button>
        </div>

        <div className="panel help-panel">
          <div className="stat-icon violet"><CheckCheck size={20} /></div>
          <h3>Track your request</h3>
          <p className="muted">
            Review status, priority, assignment, SLA deadlines, and comments.
          </p>
          <button className="secondary-btn" onClick={onViewTickets}>
            View tickets →
          </button>
        </div>
      </div>
    </>
  );
}
