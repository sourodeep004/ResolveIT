
import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import SlaBadge from './SlaBadge.jsx';
import { formatDeadline } from '../../utils/sla.js';

export default function TicketTable({
  tickets = [],
  loading = false,
  user,
  onUpdated,
  onView
}) {
  const [updating, setUpdating] = useState('');
  const [agents, setAgents] = useState([]);
  const [error, setError] = useState('');

  const isAdmin = user?.role === 'admin';
  const canManage = isAdmin || user?.role === 'agent';

  useEffect(() => {
    if (!isAdmin) return;

    let active = true;

    api.get('/tickets/meta/agents')
      .then(({ data }) => {
        const list = data.data ?? data.agents ?? data;
        if (active && Array.isArray(list)) setAgents(list);
      })
      .catch(err => {
        if (active) {
          setError(err.response?.data?.message || 'Could not load agents.');
        }
      });

    return () => {
      active = false;
    };
  }, [isAdmin]);

  async function update(ticket, changes) {
    setUpdating(ticket._id);
    setError('');

    try {
      await api.patch(`/tickets/${ticket._id}`, changes);
      onUpdated?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Ticket update failed.');
    } finally {
      setUpdating('');
    }
  }

  return (
    <div className="panel table-panel">
      {error && <div className="error-box">{error}</div>}

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Category</th>
              <th>Priority</th>
              <th>Status</th>
              <th>SLA</th>
              <th>Deadline</th>
              <th>Created</th>
              {isAdmin && <th>Assignee</th>}
              {canManage && <th>Action</th>}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="empty-state">Loading tickets…</td>
              </tr>
            ) : tickets.length === 0 ? (
              <tr>
                <td colSpan={9} className="empty-state">
                  No tickets found. Create one to get started.
                </td>
              </tr>
            ) : tickets.map(ticket => {
              const assignedId = typeof ticket.assignedTo === 'object'
                ? ticket.assignedTo?._id || ''
                : ticket.assignedTo || '';

              return (
                <tr key={ticket._id}>
                  <td>
                    <div className="ticket-title">
                      <span className="ticket-id">
                        #{ticket._id.slice(-6).toUpperCase()}
                      </span>
                      <b>{ticket.title}</b>
                      <span className="ticket-owner">
                        {ticket.createdBy?.name || 'You'}
                      </span>
                      <button className="text-btn" onClick={() => onView(ticket)}>
                        View details →
                      </button>
                    </div>
                  </td>

                  <td>{ticket.category}</td>

                  <td>
                    <span className={`priority ${ticket.priority?.toLowerCase()}`}>
                      <i />{ticket.priority}
                    </span>
                  </td>

                  <td>
                    <span className={`status ${ticket.status?.toLowerCase().replace(' ', '-')}`}>
                      {ticket.status}
                    </span>
                  </td>

                  <td><SlaBadge ticket={ticket} /></td>
                  <td className="small">{formatDeadline(ticket.dueAt)}</td>

                  <td>
                    {ticket.createdAt
                      ? new Date(ticket.createdAt).toLocaleDateString('en-IN')
                      : '—'}
                  </td>

                  {isAdmin && (
                    <td>
                      <select
                        aria-label={`Assign ${ticket.title}`}
                        value={assignedId}
                        disabled={updating === ticket._id}
                        onChange={e => update(ticket, {
                          assignedTo: e.target.value || null
                        })}
                      >
                        <option value="">Unassigned</option>
                        {agents.map(agent => (
                          <option key={agent._id} value={agent._id}>
                            {agent.name} ({agent.email})
                          </option>
                        ))}
                      </select>
                    </td>
                  )}

                  {canManage && (
                    <td>
                      {ticket.status !== 'Closed' && (
                        <select
                          aria-label={`Change status for ${ticket.title}`}
                          value=""
                          disabled={updating === ticket._id}
                          onChange={e => {
                            if (e.target.value) {
                              update(ticket, { status: e.target.value });
                            }
                          }}
                        >
                          <option value="" disabled>Update status</option>
                          {['In Progress', 'Pending', 'Resolved', 'Closed'].map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        Showing {tickets.length} ticket{tickets.length === 1 ? '' : 's'}
        <span>Updated from the live API</span>
      </div>
    </div>
  );
}
