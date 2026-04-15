import { useEffect, useState } from 'react';
import { fetchBlockchainRecords, fetchCertificates, fetchDashboardStats } from '../services/api';

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

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [records, setRecords] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadDashboardData() {
    try {
      const [statsResponse, recordsResponse, certificatesResponse] = await Promise.all([
        fetchDashboardStats(),
        fetchBlockchainRecords(12),
        fetchCertificates(50)
      ]);
      setStats(statsResponse.data);
      setRecords(recordsResponse.data?.records || []);
      setCertificates((certificatesResponse.data || []).slice(0, 5));
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    console.log('[Route] Dashboard mounted');
    loadDashboardData();

    const handleCertificateRefresh = () => {
      console.log('[Route] Dashboard refresh event received');
      loadDashboardData();
    };

    window.addEventListener('credichain:certificates-updated', handleCertificateRefresh);

    const refreshInterval = setInterval(loadDashboardData, 4000);

    return () => {
      window.removeEventListener('credichain:certificates-updated', handleCertificateRefresh);
      clearInterval(refreshInterval);
    };
  }, []);

  const successRate = stats?.totalVerifications ? Math.round((stats.validVerifications / stats.totalVerifications) * 100) : 100;
  const fraudAttempts = stats?.fraudAttempts || 0;
  const suspiciousAlerts = stats?.suspiciousAlerts || 0;
  const baseCardClass = 'h-full rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md';

  return (
    <main className="grid grid-cols-12 gap-6">
      {suspiciousAlerts > 0 ? (
        <div className="col-span-12 rounded-xl border border-red-300 bg-red-50 p-4 text-red-700">
          🚨 Suspicious activity detected in verification logs ({suspiciousAlerts} alert{suspiciousAlerts === 1 ? '' : 's'})
        </div>
      ) : null}

      <section className="col-span-12 mb-6 overflow-hidden rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md">
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
          <section className="col-span-12 mb-6 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-6">
            <article className={baseCardClass}>
              <div className="flex h-full flex-col justify-between">
                <p className="text-sm uppercase tracking-wide text-gray-500">Total Certificates</p>
                <p className="mt-2 text-xl font-semibold text-slateui-900">{stats.totalCertificates}</p>
              </div>
            </article>
            <article className={baseCardClass}>
              <div className="flex h-full flex-col justify-between">
                <p className="text-sm uppercase tracking-wide text-gray-500">Blockchain Records</p>
                <p className="mt-2 text-xl font-semibold text-slateui-900">{stats.blockchainRecords}</p>
              </div>
            </article>
            <article className={baseCardClass}>
              <div className="flex h-full flex-col justify-between">
                <p className="text-sm uppercase tracking-wide text-gray-500">Verifications</p>
                <p className="mt-2 text-xl font-semibold text-slateui-900">{stats.totalVerifications}</p>
              </div>
            </article>
            <article className={baseCardClass}>
              <div className="flex h-full flex-col justify-between">
                <p className="text-sm uppercase tracking-wide text-gray-500">Valid Checks</p>
                <p className="mt-2 text-xl font-semibold text-slateui-900">{stats.validVerifications}</p>
              </div>
            </article>
            <article className={baseCardClass}>
              <div className="flex h-full flex-col justify-between">
                <p className="text-sm uppercase tracking-wide text-gray-500">Tampered Attempts</p>
                <p className="mt-2 text-xl font-semibold text-slateui-900">{stats.tamperAttempts}</p>
              </div>
            </article>
            <article className={baseCardClass}>
              <div className="flex h-full flex-col justify-between">
                <p className="text-sm uppercase tracking-wide text-gray-500">Fraud Attempts</p>
                <p className="mt-2 text-xl font-semibold text-slateui-900">{stats.fraudAttempts || 0}</p>
              </div>
            </article>
          </section>

          <section className="col-span-12 mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
            <article className={baseCardClass}>
              <div className="flex h-full flex-col justify-between">
                <p className="text-sm uppercase tracking-wide text-gray-500">Fraud Attempts</p>
                <p className="mt-2 text-xl font-semibold text-slateui-900">{fraudAttempts}</p>
                <p className="mt-2 text-sm text-slateui-600">Invalid verification attempts detected</p>
              </div>
            </article>
            <article className={baseCardClass}>
              <div className="flex h-full flex-col justify-between">
                <p className="text-sm uppercase tracking-wide text-gray-500">Verification Success Rate</p>
                <p className="mt-2 text-xl font-semibold text-slateui-900">{successRate}%</p>
                <p className="mt-2 text-sm text-slateui-600">Valid checks over total checks</p>
              </div>
            </article>
            <article className={baseCardClass}>
              <div className="flex h-full flex-col justify-between">
                <p className="text-sm uppercase tracking-wide text-gray-500">Average Verification Time</p>
                <p className="mt-2 text-xl font-semibold text-slateui-900">&lt; 1s</p>
                <p className="mt-2 text-sm text-slateui-600">Fast hash compare with ledger lookup</p>
              </div>
            </article>
          </section>

          <section className="col-span-12 mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
            <article className={baseCardClass}>
              <div className="flex h-full flex-col justify-between">
                <p className="text-sm uppercase tracking-wide text-gray-500">Tampered Attempts</p>
                <p className="mt-2 text-xl font-semibold text-slateui-900">{stats.tamperAttempts}</p>
                <p className="mt-2 text-sm text-slateui-600">Hash mismatch detections</p>
              </div>
            </article>
            <article className={baseCardClass}>
              <div className="flex h-full flex-col justify-between">
                <p className="text-sm uppercase tracking-wide text-gray-500">Forgery Attempts</p>
                <p className="mt-2 text-xl font-semibold text-slateui-900">{stats.fraudAttempts || 0}</p>
                <p className="mt-2 text-sm text-slateui-600">Invalid signature or misuse events</p>
              </div>
            </article>
            <article className={baseCardClass}>
              <div className="flex h-full flex-col justify-between">
                <p className="text-sm uppercase tracking-wide text-gray-500">Suspicious Activity</p>
                <p className="mt-2 text-xl font-semibold text-slateui-900">{stats.suspiciousAlerts || 0}</p>
                <p className="mt-2 text-sm text-slateui-600">Repeated misuse detected</p>
              </div>
            </article>
          </section>

          <section className="col-span-12 mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
            {coreProblems.map((problem) => (
              <article key={problem.title} className={baseCardClass}>
                <div className="flex h-full flex-col justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-wide text-gray-500">Problem</p>
                    <h2 className="mt-2 text-xl font-semibold text-slateui-900">{problem.title}</h2>
                  </div>
                  <p className="mt-3 text-sm text-slateui-600">{problem.detail}</p>
                </div>
              </article>
            ))}
          </section>

          <section className="col-span-12 mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className={baseCardClass}>
              <p className="text-sm uppercase tracking-wide text-gray-500">How the system works</p>
              <ol className="mt-5 grid gap-3">
                {systemFlow.map((step, index) => (
                  <li key={step} className="flex items-start gap-3 rounded-xl bg-slateui-50 p-4 text-sm text-slateui-700">
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blue-600 text-xs font-bold text-white">{index + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className={baseCardClass}>
              <p className="text-sm uppercase tracking-wide text-gray-500">Must-have features</p>
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

          <section className="col-span-12 mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className={`lg:col-span-2 ${baseCardClass}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm uppercase tracking-wide text-gray-500">Mock blockchain records</p>
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

                  <div className="mt-4 hidden overflow-x-auto rounded-xl border border-slateui-200 lg:block">
                    <table className="table-auto w-full text-left text-sm text-slateui-700">
                      <thead className="bg-slateui-50 text-xs uppercase tracking-[0.15em] text-slateui-500">
                        <tr>
                          <th className="whitespace-nowrap px-4 py-3 text-left">Block</th>
                          <th className="whitespace-nowrap px-4 py-3 text-left">Certificate ID</th>
                          <th className="whitespace-nowrap px-4 py-3 text-left">Transaction</th>
                          <th className="whitespace-nowrap px-4 py-3 text-left">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {records.map((record) => (
                          <tr key={`${record.blockNumber}-${record.certificateId}`} className="border-t border-slateui-200 transition hover:bg-slateui-50">
                            <td className="whitespace-nowrap px-4 py-3 text-left font-semibold text-slateui-900">#{record.blockNumber}</td>
                            <td className="whitespace-nowrap px-4 py-3 text-left">{record.certificateId}</td>
                            <td className="px-4 py-3 text-left font-mono text-xs text-slateui-600">
                              <span className="block max-w-[220px] truncate" title={record.transactionHash}>{record.transactionHash}</span>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-left text-xs text-slateui-500">{new Date(record.timestamp).toLocaleString()}</td>
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

            <div className={baseCardClass}>
              <p className="text-sm uppercase tracking-wide text-gray-500">Latest issued certificates</p>
              <div className="mt-5 space-y-3">
                {certificates.length ? (
                  certificates.map((certificate) => (
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
        </>
      ) : null}
    </main>
  );
}

function LoadingState() {
  return <div className="col-span-12 mb-6 rounded-xl border border-gray-100 bg-white p-5 text-slateui-600 shadow-sm transition hover:shadow-md">Loading dashboard metrics...</div>;
}

function ErrorState({ error }) {
  return <div className="col-span-12 mb-6 rounded-xl border border-red-200 bg-red-50 p-5 text-red-700 shadow-sm transition hover:shadow-md">{error}</div>;
}
