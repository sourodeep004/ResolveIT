
export default function StatCard({ label, value, icon: Icon, tone = 'blue', note }) {
  return (
    <div className="stat-card">
      {Icon && (
        <div className={`stat-icon ${tone}`}>
          <Icon size={19} />
        </div>
      )}

      <p>{label}</p>
      <div className="stat-value">{value ?? '—'}</div>
      <span className="stat-note">{note || 'Live from your service desk'}</span>
    </div>
  );
}
