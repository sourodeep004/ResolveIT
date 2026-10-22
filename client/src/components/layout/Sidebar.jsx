
import {
  Activity,
  BarChart3,
  ChevronRight,
  CircleHelp,
  LogOut,
  ShieldCheck,
  Ticket,
  Users
} from 'lucide-react';

export default function Sidebar({
  user,
  page,
  setPage,
  ticketCount,
  onLogout,
  canViewAnalytics
}) {
  const nav = [
    { name: 'Overview', icon: BarChart3 },
    { name: 'Tickets', icon: Ticket },
    ...(canViewAnalytics ? [{ name: 'Analytics', icon: Activity }] : []),
    { name: 'Help center', icon: CircleHelp }
  ];

  const initials = (user?.name || 'U')
    .split(' ')
    .map(part => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark small-mark">
          <ShieldCheck size={21} />
        </div>

        <div className="brand-copy">
          <b>ResolveIT</b>
          <span>IT SERVICE MANAGEMENT</span>
        </div>
      </div>

      <div className="workspace-label">WORKSPACE</div>

      <nav className="sidebar-nav" aria-label="Main navigation">
        {nav.map(item => {
          const Icon = item.icon;

          return (
            <button
              key={item.name}
              type="button"
              onClick={() => setPage(item.name)}
              className={`nav-item ${page === item.name ? 'active' : ''}`}
              aria-current={page === item.name ? 'page' : undefined}
            >
              <Icon size={18} />
              <span className="nav-label">{item.name}</span>

              {item.name === 'Tickets' && (
                <span className="nav-count">{ticketCount ?? 0}</span>
              )}

              {page === item.name && (
                <ChevronRight className="nav-chevron" size={15} />
              )}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-spacer" />

      <div className="sidebar-bottom">
        <div className="support-card">
          <div className="support-icon">
            <Users size={18} />
          </div>

          <b>Need a hand?</b>
          <p>
            Find guidance for common IT issues and service requests.
          </p>

          <button
            type="button"
            className="support-link"
            onClick={() => setPage('Help center')}
          >
            Visit help center <span>↗</span>
          </button>
        </div>

        <div className="profile">
          <div className="avatar">{initials}</div>

          <div className="profile-info">
            <b>{user?.name || 'User'}</b>
            <span>{user?.role || 'Employee'}</span>
          </div>

          <button
            type="button"
            className="icon-btn"
            title="Sign out"
            aria-label="Sign out"
            onClick={onLogout}
          >
            <LogOut size={17} />
          </button>
        </div>
      </div>
    </aside>
  );
}
