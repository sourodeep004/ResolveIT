
import { AlertTriangle, CheckCircle2, Clock3 } from 'lucide-react';
import StatCard from './StatCard.jsx';
import { getSlaStatus } from '../../utils/sla.js';

export default function SlaOverview({ tickets = [], loading = false }) {
  const counts = tickets.reduce(
    (result, ticket) => {
      const status = getSlaStatus(ticket);

      if (status === 'Overdue') result.overdue += 1;
      else if (status === 'Completed') result.completed += 1;
      else result.within += 1;

      return result;
    },
    { overdue: 0, within: 0, completed: 0 }
  );

  return (
    <section className="sla-overview">
      <div className="section-heading">
        <div>
          <h2>SLA performance</h2>
          <p className="muted">Deadline compliance for the tickets currently loaded.</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          label="Overdue tickets"
          value={loading ? '—' : counts.overdue}
          icon={AlertTriangle}
          tone="rose"
          note="Requires attention"
        />
        <StatCard
          label="Within SLA"
          value={loading ? '—' : counts.within}
          icon={Clock3}
          tone="blue"
          note="Deadline not passed"
        />
        <StatCard
          label="Completed"
          value={loading ? '—' : counts.completed}
          icon={CheckCircle2}
          tone="violet"
          note="Resolved or closed"
        />
      </div>
    </section>
  );
}
