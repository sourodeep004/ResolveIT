
import StatCard from '../components/dashboard/StatCard.jsx';

export default function Analytics({ summary, tickets }) {
  const statuses = summary?.byStatus || [];
  const max = Math.max(1, ...statuses.map(item => item.count || 0));

  const resolved = summary?.resolved ??
    tickets.filter(t => ['Resolved', 'Closed'].includes(t.status)).length;

  const critical = summary?.critical ??
    tickets.filter(t => t.priority === 'Critical' &&
      !['Resolved', 'Closed'].includes(t.status)).length;

  return (
    <>
      <div className="welcome-row">
        <div>
          <p className="eyebrow">SERVICE PERFORMANCE</p>
          <h1>Analytics</h1>
          <p className="muted">
            Understand service performance and team workload.
          </p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard label="Total tickets" value={summary?.total ?? tickets.length} />
        <StatCard label="Resolved" value={resolved} tone="violet" />
        <StatCard label="Critical open" value={critical} tone="rose" />
        <StatCard
          label="Avg. resolution"
          value={summary?.averageResolutionHours == null
            ? '—'
            : `${summary.averageResolutionHours}h`}
          tone="blue"
        />
      </div>

      <section className="panel analytics-panel">
        <h2>Tickets by status</h2>
        <p className="muted">Current distribution across service workflows.</p>

        {statuses.length === 0 ? (
          <p className="empty-state">No status analytics are available yet.</p>
        ) : statuses.map(item => (
          <div className="bar-row" key={item._id}>
            <div>
              <span>{item._id}</span>
              <b>{item.count}</b>
            </div>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{ width: `${(item.count / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
