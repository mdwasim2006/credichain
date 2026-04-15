import { useEffect, useState } from 'react';
import { fetchDashboardStats } from '../services/api';

export default function AuditLogs() {
  const [auditTrail, setAuditTrail] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadAuditLogs() {
    try {
      const response = await fetchDashboardStats();
      setStats(response.data);
      setAuditTrail(response.data?.auditTrail || []);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    console.log('[Route] AuditLogs mounted');
    loadAuditLogs();

    const handleRefresh = () => {
      console.log('[Route] AuditLogs refresh event received');
      loadAuditLogs();
    };

    window.addEventListener('credichain:certificates-updated', handleRefresh);
    const refreshInterval = setInterval(loadAuditLogs, 4000);

    return () => {
      window.removeEventListener('credichain:certificates-updated', handleRefresh);
      clearInterval(refreshInterval);
    };
  }, []);

  return (
    <main className="space-y-6">
      <section className="grid-pattern glass-panel rounded-xl p-8 fade-in-up">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-700">Audit Logs</p>
        <h1 className="mt-3 text-4xl font-black text-slateui-900 sm:text-5xl">Verification history and certificate activity.</h1>
        <p className="mt-4 max-w-2xl text-slateui-600">
          Review valid, tampered, and not-found attempts in one place.
        </p>
      </section>

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState error={error} /> : null}

      {stats ? (
        <section className="grid gap-4 md:grid-cols-3">
          <AuditMetric label="Total Verifications" value={stats.totalVerifications} tone="blue" />
          <AuditMetric label="Valid Verifications" value={stats.validVerifications} tone="emerald" />
          <AuditMetric label="Tampered Attempts" value={stats.tamperAttempts} tone="red" />
        </section>
      ) : null}

      <section className="glass-panel rounded-xl p-6 fade-in-up">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slateui-500">Audit trail</p>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{auditTrail.length} events</span>
        </div>

        {auditTrail.length ? (
          <div className="mt-4 overflow-hidden rounded-xl border border-slateui-200">
            <table className="w-full text-left text-sm text-slateui-700">
              <thead className="bg-slateui-50 text-xs uppercase tracking-[0.15em] text-slateui-500">
                <tr>
                  <th className="px-4 py-3">Certificate ID</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {auditTrail.map((entry, index) => (
                  <tr key={`${entry.certificateId || 'unknown'}-${entry.timestamp || index}`} className="border-t border-slateui-200 transition hover:bg-slateui-50">
                    <td className="px-4 py-3 font-mono text-xs text-slateui-700">{entry.certificateId || 'N/A'}</td>
                    <td className="px-4 py-3">{entry.name || 'Unknown'}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeColorByStatus(entry.status)}`}>
                        {entry.status || 'UNKNOWN'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slateui-500">{entry.timestamp ? new Date(entry.timestamp).toLocaleString() : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slateui-500">No audit logs yet. Verify a certificate to populate this table.</p>
        )}
      </section>
    </main>
  );
}

function badgeColorByStatus(status) {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'VALID') {
    return 'bg-emerald-50 text-emerald-700';
  }

  if (normalized === 'TAMPERED') {
    return 'bg-red-50 text-red-700';
  }

  return 'bg-amber-50 text-amber-700';
}

function LoadingState() {
  return <div className="rounded-xl border border-slateui-200 bg-white p-6 text-slateui-600 shadow-sm">Loading audit logs...</div>;
}

function ErrorState({ error }) {
  return <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>;
}

function AuditMetric({ label, value, tone }) {
  const toneClasses = {
    blue: 'bg-blue-50 text-blue-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    red: 'bg-red-50 text-red-700'
  };

  return (
    <div className={`rounded-xl border border-slateui-200 p-5 shadow-sm ${toneClasses[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-80">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}
