
import { useEffect, useState } from 'react';
import {
  Navigate,
  Route,
  Routes,
  useNavigate
} from 'react-router-dom';

import { api } from './lib/api.js';
import Layout from './components/layout/Layout.jsx';
import CreateTicket from './components/tickets/CreateTicket.jsx';
import TicketModal from './components/tickets/TicketModal.jsx';

import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Tickets from './pages/Tickets.jsx';
import Analytics from './pages/Analytics.jsx';
import HelpCenter from './pages/HelpCenter.jsx';
import './dashboard-premium.css';
function getInitialUser() {
  try {
    return JSON.parse(localStorage.getItem('resolveit_user') || 'null');
  } catch {
    return null;
  }
}

function AppShell({ user, onLogout }) {
  const [page, setPage] = useState('Overview');
  const [tickets, setTickets] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const isAgent = user?.role === 'agent';
  const isAdmin = user?.role === 'admin';
  const canViewAnalytics = isAgent || isAdmin;

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setError('');

      try {
        const ticketParams = {
          limit: 100,
          search: search.trim() || undefined,
          status: filter === 'All' ? undefined : filter
        };

        const [ticketResponse, summaryResponse] = await Promise.all([
          api.get('/tickets', { params: ticketParams }),
          canViewAnalytics
            ? api.get('/analytics/summary')
            : Promise.resolve({ data: { data: null } })
        ]);

        if (!active) return;

        const receivedTickets = ticketResponse.data?.data;

        setTickets(Array.isArray(receivedTickets) ? receivedTickets : []);
        setSummary(summaryResponse.data?.data ?? null);
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
            'Could not load dashboard data. Check your backend connection.'
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [canViewAnalytics, search, filter, refreshKey]);

  function refreshTickets() {
    setRefreshKey(value => value + 1);
  }

  function pageDescription() {
    switch (page) {
      case 'Overview':
        return 'Here’s what’s happening with your IT service desk today.';
      case 'Tickets':
        return 'Track requests, follow updates, and keep work moving.';
      case 'Analytics':
        return 'Understand service performance and team workload.';
      default:
        return 'Find the support you need to get back to work.';
    }
  }

  return (
    <Layout
      user={user}
      page={page}
      setPage={setPage}
      ticketCount={tickets.length}
      onLogout={onLogout}
      canViewAnalytics={canViewAnalytics}
    >
      {error && <div className="error-box">{error}</div>}

      {page !== 'Overview' && page !== 'Help center' && (
        <div className="page-intro">
          <p className="eyebrow">RESOLVEIT SERVICE DESK</p>
          <p className="muted">{pageDescription()}</p>
        </div>
      )}

      {page === 'Overview' && (
        <Dashboard
          user={user}
          tickets={tickets}
          summary={summary}
          loading={loading}
          onCreateTicket={() => setShowCreate(true)}
          onUpdated={refreshTickets}
          onView={ticket => setSelectedTicketId(ticket._id)}
          onViewAll={() => setPage('Tickets')}
        />
      )}

      {page === 'Tickets' && (
        <Tickets
          tickets={tickets}
          loading={loading}
          user={user}
          search={search}
          setSearch={setSearch}
          filter={filter}
          setFilter={setFilter}
          onUpdated={refreshTickets}
          onView={ticket => setSelectedTicketId(ticket._id)}
          onCreateTicket={() => setShowCreate(true)}
        />
      )}

      {page === 'Analytics' && canViewAnalytics && (
        <Analytics summary={summary} tickets={tickets} />
      )}

      {page === 'Help center' && (
        <HelpCenter
          onCreateTicket={() => setShowCreate(true)}
          onViewTickets={() => setPage('Tickets')}
        />
      )}

      {showCreate && (
        <CreateTicket
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            refreshTickets();
            setPage('Tickets');
          }}
        />
      )}

      {selectedTicketId && (
        <TicketModal
          ticketId={selectedTicketId}
          onClose={() => setSelectedTicketId('')}
          onChanged={refreshTickets}
        />
      )}
    </Layout>
  );
}

export default function App() {
  const [user, setUser] = useState(getInitialUser);
  const navigate = useNavigate();

  function onLogin(data) {
    localStorage.setItem('resolveit_token', data.token);
    localStorage.setItem('resolveit_user', JSON.stringify(data.user));
    setUser(data.user);
    navigate('/');
  }

  function onLogout() {
    localStorage.removeItem('resolveit_token');
    localStorage.removeItem('resolveit_user');
    setUser(null);
    navigate('/login');
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user
          ? <Navigate to="/" replace />
          : <Login onLogin={onLogin} />}
      />

      <Route
        path="/register"
        element={user
          ? <Navigate to="/" replace />
          : <Register onLogin={onLogin} />}
      />

      <Route
        path="/*"
        element={user
          ? <AppShell user={user} onLogout={onLogout} />
          : <Navigate to="/login" replace />}
      />
    </Routes>
  );
}
