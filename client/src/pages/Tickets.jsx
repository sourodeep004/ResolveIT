
import { Search } from 'lucide-react';
import TicketTable from '../components/tickets/TicketTable.jsx';
import './tickets-premium.css';

export default function Tickets({
  tickets,
  loading,
  user,
  search,
  setSearch,
  filter,
  setFilter,
  onUpdated,
  onView,
  onCreateTicket
}) {
  return (
    <>
      <div className="welcome-row">
        <div>
          <p className="eyebrow">SERVICE REQUESTS</p>
          <h1>Tickets</h1>
          <p className="muted">
            Track requests, follow updates, and keep work moving.
          </p>
        </div>
        <button className="primary-btn create-btn" onClick={onCreateTicket}>
          + Create ticket
        </button>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <Search size={17} />
          <input
            placeholder="Search tickets…"
            value={search}
            onChange={event => setSearch(event.target.value)}
          />
        </div>

        <select value={filter} onChange={event => setFilter(event.target.value)}>
          <option value="All">All statuses</option>
          {['Open', 'In Progress', 'Pending', 'Resolved', 'Closed'].map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      <TicketTable
        tickets={tickets}
        loading={loading}
        user={user}
        onUpdated={onUpdated}
        onView={onView}
      />
    </>
  );
}
