
import { useEffect, useRef, useState } from 'react';
import {
  ShieldCheck,
  ChevronDown,
  UserRound,
  Mail,
  Shield,
  Settings,
  LogOut,
  Check,
  X
} from 'lucide-react';
import Sidebar from './Sidebar.jsx';

export default function Layout({
  user,
  page,
  setPage,
  ticketCount,
  onLogout,
  canViewAnalytics,
  children
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileDetailsOpen, setProfileDetailsOpen] = useState(false);
  const profileRef = useRef(null);

  const displayName = user?.name?.trim() || 'User';

  const initials = displayName
    .split(/\s+/)
    .map(part => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const role = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : 'Employee';

  // Close the profile menu when clicking outside it.
  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setProfileOpen(false);
        setProfileDetailsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  function openProfileDetails() {
    setProfileOpen(false);
    setProfileDetailsOpen(true);
  }

  function handleLogout() {
    setProfileOpen(false);
    onLogout?.();
  }

  return (
    <div className="app-layout">
      <Sidebar
        user={user}
        page={page}
        setPage={setPage}
        ticketCount={ticketCount}
        onLogout={onLogout}
        canViewAnalytics={canViewAnalytics}
      />

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Workspace</span>
            <span className="breadcrumb-separator">/</span>
            <b>{page}</b>
          </div>

          <div className="top-actions">
            <span className="system-status">
              <i className="system-status-dot" />
              <span>All systems operational</span>
            </span>

            <span className="topbar-divider" />

            {/* Interactive profile menu */}
            <div className="profile-menu-wrapper" ref={profileRef}>
              <button
                type="button"
                className={`topbar-user profile-trigger ${
                  profileOpen ? 'profile-trigger-active' : ''
                }`}
                onClick={() => setProfileOpen(previous => !previous)}
                aria-haspopup="menu"
                aria-expanded={profileOpen}
                aria-label="Open profile menu"
              >
                <div className="topbar-user-copy">
                  <b>{displayName}</b>
                  <span>{role}</span>
                </div>

                <div className="avatar top-avatar">
                  {initials}
                </div>

                <ChevronDown
                  size={15}
                  className={`profile-chevron ${
                    profileOpen ? 'profile-chevron-open' : ''
                  }`}
                />
              </button>

              {profileOpen && (
                <div className="profile-dropdown" role="menu">
                  <div className="profile-dropdown-header">
                    <div className="avatar profile-dropdown-avatar">
                      {initials}
                    </div>

                    <div className="profile-dropdown-identity">
                      <strong>{displayName}</strong>
                      <span>{role} account</span>
                    </div>

                    <span
                      className="profile-online-indicator"
                      title="Signed in"
                    />
                  </div>

                  <div className="profile-dropdown-divider" />

                  <button
                    type="button"
                    className="profile-menu-item"
                    role="menuitem"
                    onClick={openProfileDetails}
                  >
                    <span className="profile-menu-icon">
                      <UserRound size={17} />
                    </span>

                    <span className="profile-menu-copy">
                      <strong>My profile</strong>
                      <small>View your account information</small>
                    </span>
                  </button>

                  <div className="profile-account-summary">
                    <div className="profile-summary-row">
                      <Mail size={15} />
                      <span>{user?.email || 'Email not available'}</span>
                    </div>

                    <div className="profile-summary-row">
                      <Shield size={15} />
                      <span>{role} access</span>
                    </div>
                  </div>

                  <div className="profile-dropdown-divider" />

                  <button
                    type="button"
                    className="profile-menu-item profile-logout-item"
                    role="menuitem"
                    onClick={handleLogout}
                  >
                    <span className="profile-menu-icon">
                      <LogOut size={17} />
                    </span>

                    <span className="profile-menu-copy">
                      <strong>Sign out</strong>
                      <small>End your current session</small>
                    </span>
                  </button>

                  <div className="profile-dropdown-footer">
                    <ShieldCheck size={14} />
                    <span>Secured by ResolveIT</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="content">
          {children}

          <footer className="app-footer">
            <span>© 2026 ResolveIT</span>
            <span>Built for reliable IT service delivery</span>
          </footer>
        </div>
      </main>

      {/* Profile details dialog */}
      {profileDetailsOpen && (
        <div
          className="profile-dialog-backdrop"
          onMouseDown={event => {
            if (event.target === event.currentTarget) {
              setProfileDetailsOpen(false);
            }
          }}
        >
          <section
            className="profile-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-dialog-title"
          >
            <div className="profile-dialog-top">
              <div className="profile-dialog-heading">
                <div className="profile-dialog-icon">
                  <UserRound size={22} />
                </div>

                <div>
                  <p className="eyebrow">ACCOUNT SETTINGS</p>
                  <h2 id="profile-dialog-title">My profile</h2>
                </div>
              </div>

              <button
                type="button"
                className="icon-btn"
                onClick={() => setProfileDetailsOpen(false)}
                aria-label="Close profile details"
              >
                <X size={19} />
              </button>
            </div>

            <div className="profile-dialog-user">
              <div className="avatar profile-dialog-avatar">
                {initials}
              </div>

              <div>
                <h3>{displayName}</h3>
                <p>{role} account</p>
              </div>

              <span className="profile-account-badge">
                <Check size={13} />
                Signed in
              </span>
            </div>

            <div className="profile-detail-list">
              <div className="profile-detail-item">
                <span className="profile-detail-icon">
                  <UserRound size={17} />
                </span>

                <div>
                  <small>Full name</small>
                  <strong>{displayName}</strong>
                </div>
              </div>

              <div className="profile-detail-item">
                <span className="profile-detail-icon">
                  <Mail size={17} />
                </span>

                <div>
                  <small>Email address</small>
                  <strong>{user?.email || 'Not provided'}</strong>
                </div>
              </div>

              <div className="profile-detail-item">
                <span className="profile-detail-icon">
                  <Shield size={17} />
                </span>

                <div>
                  <small>Account role</small>
                  <strong>{role}</strong>
                </div>
              </div>
            </div>

            <div className="profile-dialog-actions">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setProfileDetailsOpen(false)}
              >
                Close
              </button>

              <button
                type="button"
                className="primary-btn"
                onClick={() => {
                  setProfileDetailsOpen(false);
                  handleLogout();
                }}
              >
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
