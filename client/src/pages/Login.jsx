import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  ChartNoAxesCombined,
  Eye,
  EyeOff,
  ListChecks,
  LockKeyhole,
  Mail,
  ShieldCheck,
  User,
  Users
} from 'lucide-react';
import { api } from '../lib/api.js';
import './Login.css';

const FEATURES = [
  {
    Icon: ListChecks,
    title: 'Smart ticket workflows',
    text: 'Track, prioritize, and resolve issues efficiently.'
  },
  {
    Icon: ChartNoAxesCombined,
    title: 'SLA visibility',
    text: 'Stay on top of deadlines and service levels.'
  },
  {
    Icon: Users,
    title: 'One connected service desk',
    text: 'People, teams, and information in one place.'
  }
];

const STATUS_ROWS = [
  { label: 'Resolved', tone: 'green' },
  { label: 'In Progress', tone: 'blue' },
  { label: 'Open', tone: 'orange' }
];

const BARS = [18, 24, 22, 32, 38, 36, 48, 56, 64, 74];

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      const { data } = await api.post('/auth/login', {
        email: email.trim(),
        password
      });

      onLogin(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          'Unable to sign in. Please check your credentials and try again.'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="resolve-login">
      {/* Pure CSS/SVG background — no image file needed */}
      <div className="resolve-login__backdrop" aria-hidden="true">
        <svg
          className="resolve-login__curves"
          viewBox="0 0 1672 941"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="rl-curve" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#4f7dff" stopOpacity="0" />
              <stop offset="50%" stopColor="#6f8dff" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#8b6bff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M 760 420 C 800 340 870 320 960 345"
            fill="none"
            stroke="url(#rl-curve)"
            strokeWidth="1.5"
          />
          <path
            d="M 640 760 C 760 800 880 880 900 800 C 915 740 960 700 1010 690"
            fill="none"
            stroke="url(#rl-curve)"
            strokeWidth="1.5"
          />
          <path
            d="M 1540 40 C 1620 80 1660 150 1672 230"
            fill="none"
            stroke="url(#rl-curve)"
            strokeWidth="1.5"
          />
          <path
            d="M 0 780 C 120 720 280 720 420 800"
            fill="none"
            stroke="url(#rl-curve)"
            strokeWidth="1.5"
          />
          <circle cx="891" cy="329" r="7" fill="#7b8cff" />
          <circle cx="891" cy="329" r="16" fill="#7b8cff" opacity="0.18" />
          <circle cx="887" cy="801" r="5" fill="#4f9bff" />
          <circle cx="799" cy="867" r="9" fill="#6f6bff" />
          <circle cx="799" cy="867" r="20" fill="#6f6bff" opacity="0.18" />
        </svg>
      </div>

      <div className="resolve-login__layout">
        {/* ---------- Left: product introduction ---------- */}
        <section className="resolve-login__intro">
          <Link
            to="/login"
            className="resolve-login__brand"
            aria-label="ResolveIT home"
          >
            <span className="resolve-login__brand-icon">
              <ShieldCheck size={34} strokeWidth={2.2} />
            </span>
            <span className="resolve-login__brand-name">
              Resolve<span>IT</span>
            </span>
          </Link>

          <p className="resolve-login__eyebrow">
            IT SERVICE MANAGEMENT PLATFORM
          </p>

          <h1 className="resolve-login__headline">
            IT issues, <span>resolved.</span>
            <br />
            Work moves forward.
          </h1>

          <p className="resolve-login__description">
            One calm workspace for tickets, teams, and service-level
            commitments.
          </p>

          <div className="resolve-login__features">
            {FEATURES.map(({ Icon, title, text }) => (
              <div className="resolve-login__feature" key={title}>
                <span className="resolve-login__feature-icon">
                  <Icon size={26} />
                </span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="resolve-login__trust">
            <div className="resolve-login__trust-line" />
            <p>BUILT FOR TEAMS THAT KEEP WORK MOVING</p>
            <div className="resolve-login__trust-bottom">
              <div className="resolve-login__avatars">
                <span className="resolve-login__avatar resolve-login__avatar--1">
                  <User size={22} />
                </span>
                <span className="resolve-login__avatar resolve-login__avatar--2">
                  <User size={22} />
                </span>
                <span className="resolve-login__avatar resolve-login__avatar--3">
                  <User size={22} />
                </span>
                <span className="resolve-login__avatar resolve-login__avatar--more">
                  +3
                </span>
              </div>
              <span className="resolve-login__trust-divider" />
              <span>Reliable service. Less friction.</span>
            </div>
          </div>
        </section>

        {/* ---------- Middle: floating product cards ---------- */}
        <aside className="resolve-login__showcase" aria-hidden="true">
          <div className="rl-glass rl-glass--chart">
            <div className="rl-glass__title">Tickets Resolved</div>
            <div className="rl-glass__metric">
              +32%
              <ArrowUpRight size={20} strokeWidth={2.6} />
            </div>
            <svg
              className="rl-glass__chart"
              viewBox="0 0 240 90"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="rl-bar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4d7bff" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#2a2fd8" stopOpacity="0.2" />
                </linearGradient>
                <linearGradient id="rl-line" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3b82ff" />
                  <stop offset="100%" stopColor="#7aa7ff" />
                </linearGradient>
              </defs>
              {BARS.map((h, i) => (
                <rect
                  key={i}
                  x={8 + i * 23}
                  y={90 - h}
                  width="15"
                  height={h}
                  rx="2"
                  fill="url(#rl-bar)"
                />
              ))}
              <polyline
                points="8,66 31,58 54,62 77,48 100,44 123,46 146,32 169,22 192,16 215,8"
                fill="none"
                stroke="url(#rl-line)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="rl-glass rl-glass--list">
            {STATUS_ROWS.map(({ label, tone }) => (
              <div className="rl-row" key={label}>
                <span className="rl-row__avatar" />
                <span className="rl-row__lines">
                  <i />
                  <i />
                </span>
                <span className={`rl-row__status rl-row__status--${tone}`}>
                  <b />
                  {label}
                </span>
              </div>
            ))}
          </div>

          <div className="rl-glass rl-glass--sla">
            <span className="rl-sla__shield">
              <ShieldCheck size={30} strokeWidth={2.4} />
            </span>
            <div className="rl-sla__body">
              <div className="rl-sla__label">SLA On Track</div>
              <div className="rl-sla__value">98%</div>
              <div className="rl-sla__bar">
                <span />
              </div>
            </div>
          </div>
        </aside>

        {/* ---------- Right: sign-in card ---------- */}
        <section className="resolve-login__form-area">
          <div className="resolve-login__card">
            <div className="resolve-login__card-brand">
              <div className="resolve-login__card-brand-row">
                <span className="resolve-login__card-logo">
                  <ShieldCheck size={32} strokeWidth={2.2} />
                </span>
                <span className="resolve-login__card-brand-name">
                  Resolve<span>IT</span>
                </span>
              </div>
              <p>IT SERVICE MANAGEMENT PLATFORM</p>
            </div>

            <div className="resolve-login__separator" />

            <div className="resolve-login__welcome">
              <h2>Welcome back</h2>
              <p>Sign in to your ResolveIT workspace.</p>
            </div>

            {error && (
              <div className="resolve-login__error" role="alert">
                {error}
              </div>
            )}

            <form className="resolve-login__form" onSubmit={submit}>
              <label className="resolve-login__label" htmlFor="resolve-email">
                Email address
              </label>
              <div className="resolve-login__input-wrap">
                <Mail size={22} aria-hidden="true" />
                <input
                  id="resolve-email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>

              <label
                className="resolve-login__label"
                htmlFor="resolve-password"
              >
                Password
              </label>
              <div className="resolve-login__input-wrap">
                <LockKeyhole size={22} aria-hidden="true" />
                <input
                  id="resolve-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  className="resolve-login__password-toggle"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <button
                className="resolve-login__submit"
                type="submit"
                disabled={busy}
              >
                <span>{busy ? 'Signing in...' : 'Sign in'}</span>
                <ArrowRight size={20} />
              </button>
            </form>

            <div className="resolve-login__access-divider">
              <span />
              <p>SECURE WORKSPACE ACCESS</p>
              <span />
            </div>

            <p className="resolve-login__register">
              New to ResolveIT? <Link to="/register">Create an employee account</Link>
            </p>
          </div>

          <p className="resolve-login__mobile-footer">
            ResolveIT · Service management, made clearer.
          </p>
        </section>
      </div>
    </main>
  );
}