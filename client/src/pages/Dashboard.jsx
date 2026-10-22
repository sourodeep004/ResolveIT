
import {
  Activity,
  CircleHelp,
  ClipboardList,
  Zap
} from 'lucide-react';

import StatCard from '../components/dashboard/StatCard.jsx';
import SlaOverview from '../components/dashboard/SlaOverview.jsx';
import TicketTable from '../components/tickets/TicketTable.jsx';

export default function Dashboard({
  user,
  tickets = [],
  summary,
  loading,
  onCreateTicket,
  onUpdated,
  onView,
  onViewAll
}) {
  const firstName = user?.name?.trim()?.split(/\s+/)[0] || 'there';

  const stats = [
    {
      label: 'Total tickets',
      value: summary?.total ?? tickets.length,
      icon: ClipboardList,
      tone: 'blue'
    },
    {
      label: 'Open tickets',
      value: summary?.open ??
        tickets.filter(ticket => ticket.status === 'Open').length,
      icon: CircleHelp,
      tone: 'amber'
    },
    {
      label: 'In progress',
      value: summary?.inProgress ??
        tickets.filter(ticket => ticket.status === 'In Progress').length,
      icon: Activity,
      tone: 'violet'
    },
    {
      label: 'Critical issues',
      value: summary?.critical ??
        tickets.filter(ticket =>
          ticket.priority === 'Critical' &&
          !['Resolved', 'Closed'].includes(ticket.status)
        ).length,
      icon: Zap,
      tone: 'rose'
    }
  ];

  return (
    <div className="dashboard-page">
      <section className="welcome-row">
        <div className="welcome-copy">
          <p className="eyebrow">RESOLVEIT SERVICE DESK</p>

          <h1>Good to see you, {firstName}.</h1>

          <p className="muted welcome-description">
            Here’s what’s happening with your IT service desk today.
          </p>
        </div>

        <button
          type="button"
          className="primary-btn create-btn"
          onClick={onCreateTicket}
        >
          <span aria-hidden="true">+</span>
          Create ticket
        </button>
      </section>

      <section className="stats-grid" aria-label="Ticket statistics">
        {stats.map(stat => (
          <StatCard
            key={stat.label}
            {...stat}
            value={loading ? '—' : stat.value}
          />
        ))}
      </section>

      <SlaOverview tickets={tickets} loading={loading} />

      <section className="recent-tickets-section">
        <div className="section-heading">
          <div>
            <h2>Recent tickets</h2>
            <p className="muted">
              The latest service requests in your workspace.
            </p>
          </div>

          <button
            type="button"
            className="text-btn"
            onClick={onViewAll}
          >
            View all tickets
            <span aria-hidden="true">→</span>
          </button>
        </div>

        <div className="recent-tickets-table">
          <TicketTable
            tickets={tickets.slice(0, 5)}
            loading={loading}
            user={user}
            onUpdated={onUpdated}
            onView={onView}
          />
        </div>
      </section>
    </div>
  );
}
