
import { getSlaClass, getSlaStatus } from '../../utils/sla.js';

export default function SlaBadge({ ticket }) {
  const status = getSlaStatus(ticket);

  return (
    <span
      className={`sla-badge ${getSlaClass(status)}`}
      title={ticket?.dueAt ? `Deadline: ${ticket.dueAt}` : 'No SLA deadline'}
    >
      <span className="sla-dot" />
      {status}
    </span>
  );
}
