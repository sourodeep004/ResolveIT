
import { useState } from 'react';
import { api } from '../../lib/api.js';

export default function CreateTicket({ onClose, onCreated }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Software',
    priority: 'Medium'
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function change(event) {
    setForm(previous => ({
      ...previous,
      [event.target.name]: event.target.value
    }));
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      await api.post('/tickets', form);
      onCreated?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create ticket.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="modal" role="dialog" aria-modal="true">
        <div className="modal-head">
          <div>
            <p className="eyebrow">SERVICE REQUEST</p>
            <h2>Create a ticket</h2>
          </div>
          <button className="icon-btn close-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <p className="muted">Describe the issue so the right person can help.</p>
        {error && <div className="error-box">{error}</div>}

        <form className="stack" onSubmit={submit}>
          <label>
            Ticket title
            <input
              name="title"
              minLength={5}
              maxLength={120}
              value={form.title}
              onChange={change}
              required
              placeholder="e.g. Unable to connect to VPN"
            />
          </label>

          <label>
            Description
            <textarea
              name="description"
              minLength={10}
              maxLength={5000}
              rows={4}
              value={form.description}
              onChange={change}
              required
              placeholder="What happened? What have you tried so far?"
            />
          </label>

          <div className="form-row">
            <label>
              Category
              <select name="category" value={form.category} onChange={change}>
                {['Hardware', 'Software', 'Network', 'Access', 'Other'].map(item => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>

            <label>
              Priority
              <select name="priority" value={form.priority} onChange={change}>
                {['Low', 'Medium', 'High', 'Critical'].map(item => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>

          <p className="muted small">
            SLA targets: Critical 4h · High 8h · Medium 24h · Low 72h
          </p>

          <div className="modal-actions">
            <button type="button" className="secondary-btn" onClick={onClose}>
              Cancel
            </button>
            <button className="primary-btn" disabled={busy}>
              {busy ? 'Submitting…' : 'Submit ticket'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
