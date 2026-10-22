
export function getSlaStatus(ticket) {
  if (ticket?.slaStatus) {
    return ticket.slaStatus;
  }

  if (['Resolved', 'Closed'].includes(ticket?.status)) {
    return 'Completed';
  }

  if (ticket?.dueAt) {
    const deadline = new Date(ticket.dueAt).getTime();

    if (!Number.isNaN(deadline) && deadline < Date.now()) {
      return 'Overdue';
    }
  }

  return 'Within SLA';
}

export function getSlaClass(status) {
  switch (status) {
    case 'Overdue':
      return 'sla-overdue';

    case 'Completed':
      return 'sla-completed';

    default:
      return 'sla-within';
  }
}

export function formatDeadline(value) {
  if (!value) {
    return 'No deadline';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Invalid deadline';
  }

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function getTimeRemaining(value) {
  if (!value) {
    return 'No deadline';
  }

  const remaining = new Date(value).getTime() - Date.now();

  if (Number.isNaN(remaining)) {
    return 'Unknown';
  }

  if (remaining <= 0) {
    return 'Deadline passed';
  }

  const totalMinutes = Math.floor(remaining / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `${days}d ${hours}h remaining`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  }

  return `${minutes}m remaining`;
}
