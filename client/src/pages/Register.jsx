
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { api } from '../lib/api.js';

const departments = [
  'General',
  'Engineering',
  'Information Technology',
  'Human Resources',
  'Finance',
  'Operations',
  'Customer Support',
  'Sales',
  'Marketing',
  'Other'
];

export default function Register({ onLogin }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    department: 'General'
  });

  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function change(event) {
    const { name, value } = event.target;

    setForm(previous => ({
      ...previous,
      [name]: value
    }));
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      const { data } = await api.post('/auth/register', form);
      onLogin(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Registration failed. Please try again.'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-wrap">
      <section className="login-card register-card">
        <div className="brand-mark">
          <ShieldCheck size={25} />
        </div>

        <p className="eyebrow">GET STARTED</p>
        <h1>Create your account.</h1>
        <p className="muted">
          Create your employee account to get started with ResolveIT.
        </p>

        {error && (
          <div className="error-box" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="stack">
          <label htmlFor="register-name">
            Full name
            <input
              id="register-name"
              name="name"
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={change}
              minLength={2}
              maxLength={100}
              placeholder="Enter your full name"
              required
            />
          </label>

          <label htmlFor="register-email">
            Work email
            <input
              id="register-email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={change}
              placeholder="you@company.com"
              required
            />
          </label>

          <label htmlFor="register-department">
            Department
            <select
              id="register-department"
              name="department"
              className="department-select"
              value={form.department}
              onChange={change}
            >
              {departments.map(department => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
          </label>

          <label htmlFor="register-password">
            Password
            <input
              id="register-password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={change}
              minLength={8}
              placeholder="Create a strong password"
              required
            />
          </label>

          <button
            type="submit"
            className="primary-btn"
            disabled={busy}
          >
            {busy ? 'Creating account…' : 'Create account'}
            <span aria-hidden="true">→</span>
          </button>
        </form>

        <p className="small muted register-footer">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </section>
    </main>
  );
}
