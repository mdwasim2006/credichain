import { useEffect, useState } from 'react';
import StatCard from '../components/StatCard';
import { fetchBlockchainRecords, fetchDashboardStats } from '../services/api';

const coreProblems = [
  {
    title: 'Certificate forgery is common',
    detail: 'Fake credentials are easy to produce and hard to detect quickly in manual processes.'
  },
  {
    title: 'Manual verification is slow',
    detail: 'Recruiters and institutions spend too much time validating records over email and paperwork.'
  },
  {
    title: 'No trusted digital trail',
    detail: 'Most certificates lack a tamper-proof audit path that can be verified instantly.'
  }
];

const systemFlow = [
  'Admin creates certificate',
  'System generates SHA-256 hash',
  'Hash is stored in DB + mock blockchain',
  'QR code is generated',
  'User scans QR or enters certificate ID',
  'System recalculates hash and compares',
  'Result shown as VALID or INVALID'
];

const keyFeatures = [
  'Certificate generation',
  'Unique ID + hashing',
  'Blockchain-style storage',
  'QR-based verification',
  'Tamper detection'
];

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [records, setRecords] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const successRate = stats?.totalVerifications ? Math.round((stats.validVerifications / stats.totalVerifications) * 100) : 100;
  const fraudAttempts = stats?.tamperAttempts || 0;
  const auditTrail = stats?.auditTrail || [];

  useEffect(() => {
    let isActive = true;

    async function loadStats() {
      try {
        const [statsResponse, recordsResponse] = await Promise.all([
          fetchDashboardStats(),
          fetchBlockchainRecords(12)
        ]);
        if (isActive) {
          setStats(statsResponse.data);
          setRecords(recordsResponse.data?.records || []);
        }
      } catch (loadError) {
        if (isActive) {
          setError(loadError.message);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    loadStats();

    const refreshInterval = setInterval(() => {
      loadStats();
    }, 4000);

    return () => {
      isActive = false;
      clearInterval(refreshInterval);
    };
  }, []);

  return (
    <main className="space-y-6">
      <section className="grid-pattern glass-panel overflow-hidden rounded-xl p-8 fade-in-up">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-700">CrediChain - Decentralized Credential Verification System</p>
          <h1 className="mt-3 text-4xl font-black text-slateui-900 sm:text-5xl">Tamper-proof certificates. Instant trust.</h1>
          <p className="mt-4 max-w-2xl text-slateui-600">
            A blockchain-inspired credential network where every certificate can be validated in seconds using SHA-256 hash comparison and immutable ledger records.
          </p>
          <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slateui-600">
            <span className="rounded-full bg-emerald-50 px-3 py-2 text-emerald-700">Authenticity</span>
            <span className="rounded-full bg-blue-50 px-3 py-2 text-blue-700">Instant verification</span>
            <span className="rounded-full bg-amber-50 px-3 py-2 text-amber-700">Zero forgery</span>
          </div>
        </div>
      </section>

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState error={error} /> : null}

      {stats ? (
        <>
          <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <StatCard label="Total Certificates" value={stats.totalCertificates} accent="ocean" />
            <StatCard label="Blockchain Records" value={stats.blockchainRecords} accent="mint" />
            <StatCard label="Verifications" value={stats.totalVerifications} accent="amber" />
            <StatCard label="Valid Checks" value={stats.validVerifications} accent="mint" />
            <StatCard label="Tampered Attempts" value={stats.tamperAttempts} accent="rose" />
          </section>

          <section className="mt-5 grid gap-4 md:grid-cols-3">
            <StatCard label="Fraud Attempts" value={fraudAttempts} accent="rose" description="Invalid verification attempts detected" />
            <StatCard label="Verification Success Rate" value={`${successRate}%`} accent="mint" description="Valid checks over total checks" />
            <StatCard label="Average Verification Time" value="< 1s" accent="ocean" description="Fast hash compare with ledger lookup" />
          </section>

          <section className="mt-8 grid gap-5 lg:grid-cols-3">
            {coreProblems.map((problem) => (
              <article key={problem.title} className="glass-panel rounded-xl p-6 fade-in-up">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-red-700">Problem</p>
                <h2 className="mt-2 text-xl font-bold text-slateui-900">{problem.title}</h2>
                <p className="mt-3 text-sm text-slateui-600">{problem.detail}</p>
              </article>
            ))}
          </section>

          <section className="mt-8 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="glass-panel rounded-xl p-6 fade-in-up">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slateui-500">How the system works</p>
              <ol className="mt-5 grid gap-3">
                {systemFlow.map((step, index) => (
                  <li key={step} className="flex items-start gap-3 rounded-xl bg-slateui-50 p-4 text-sm text-slateui-700">
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blue-600 text-xs font-bold text-white">{index + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="glass-panel rounded-xl p-6 fade-in-up">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slateui-500">Must-have features</p>
              <ul className="mt-5 space-y-3 text-sm text-slateui-700">
                {keyFeatures.map((feature) => (
                  <li key={feature} className="rounded-xl bg-slateui-50 p-4">
                    <span className="mr-2 text-emerald-600">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="mt-8 grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="glass-panel rounded-xl p-6 fade-in-up">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slateui-500">Mock blockchain records</p>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{records.length} entries</span>
              </div>

              {records.length ? (
                <>
                  <div className="mb-4 flex flex-wrap gap-2">
                    {records
                      .slice()
                      .reverse()
                      .map((record) => {
                        return (
                          <div key={`${record.blockNumber}-chain`} className="flex items-center gap-2 rounded-xl border border-slateui-200 bg-white px-3 py-2 text-xs shadow-sm transition hover:shadow-md">
                            <span className="font-semibold text-blue-700">Block #{record.blockNumber}</span>
                            <span className="text-slateui-500">prev</span>
                            <span className="font-mono text-amber-700">{(record.previousHash || 'GENESIS').slice(0, 10)}...</span>
                            <span className="text-slateui-400">-&gt;</span>
                            <span className="font-mono text-emerald-700">{(record.hash || 'N/A').slice(0, 10)}...</span>
                          </div>
                        );
                      })}
                  </div>

                  <div id="audit-logs" className="mt-4 hidden overflow-hidden rounded-xl border border-slateui-200 lg:block">
                    <table className="w-full text-left text-sm text-slateui-700">
                      <thead className="bg-slateui-50 text-xs uppercase tracking-[0.15em] text-slateui-500">
                        <tr>
                          <th className="px-4 py-3">Block</th>
                          <th className="px-4 py-3">Certificate ID</th>
                          <th className="px-4 py-3">Transaction</th>
                          <th className="px-4 py-3">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {records.map((record) => (
                          <tr key={`${record.blockNumber}-${record.certificateId}`} className="border-t border-slateui-200 transition hover:bg-slateui-50">
                            <td className="px-4 py-3 font-semibold text-slateui-900">#{record.blockNumber}</td>
                            <td className="px-4 py-3">{record.certificateId}</td>
                            <td className="px-4 py-3 font-mono text-xs text-slateui-600">{record.transactionHash}</td>
                            <td className="px-4 py-3 text-xs text-slateui-500">{new Date(record.timestamp).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 space-y-3 lg:hidden">
                    {records.map((record) => (
                      <div key={`${record.blockNumber}-${record.certificateId}`} className="rounded-xl border border-slateui-200 bg-white p-4 text-sm shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slateui-500">Block #{record.blockNumber}</p>
                        <p className="mt-1 font-semibold text-slateui-900">{record.certificateId}</p>
                        <p className="mt-2 break-all font-mono text-xs text-slateui-600">{record.transactionHash}</p>
                        <p className="mt-2 text-xs text-slateui-500">{new Date(record.timestamp).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="mt-4 text-sm text-slateui-500">No blockchain records yet. Issue a certificate from Admin Panel to generate entries.</p>
              )}
            </div>

            <div className="glass-panel rounded-xl p-6 fade-in-up">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slateui-500">Latest issued certificates</p>
              <div className="mt-5 space-y-3">
                {stats.latestCertificates?.length ? (
                  stats.latestCertificates.map((certificate) => (
                    <div key={certificate._id} className="rounded-xl border border-slateui-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md">
                      <p className="text-base font-semibold text-slateui-900">{certificate.name}</p>
                      <p className="text-sm text-slateui-600">{certificate.course}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.2em] text-blue-700">{certificate.certificateId}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slateui-500">No certificates issued yet.</p>
                )}
              </div>
            </div>
          </section>

          <section className="mt-8 glass-panel rounded-xl p-6 fade-in-up">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slateui-500">Certificate audit and transaction dashboard</p>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{auditTrail.length} recent checks</span>
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
                            {entry.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slateui-500">{entry.timestamp ? new Date(entry.timestamp).toLocaleString() : 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slateui-500">No verification audits yet. Run checks in Verify page.</p>
            )}
          </section>
        </>
      ) : null}
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
  return <div className="mt-8 rounded-xl border border-slateui-200 bg-white p-6 text-slateui-600 shadow-sm">Loading dashboard metrics...</div>;
}

function ErrorState({ error }) {
  return <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>;
}