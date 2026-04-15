import { useEffect, useState } from 'react';
import CertificateCard from '../components/CertificateCard';
import ResultAlert from '../components/ResultAlert';
import { fetchDashboardStats, fetchFraudStatus } from '../services/api';
import { fetchCertificateById, uploadVerifyCertificate, verifyCertificate } from '../services/api';

const demoCertificates = [
  'CRD-DEMO-001',
  'CRD-DEMO-002'
];

function extractCertificateId(input) {
  const trimmedInput = input.trim();

  if (!trimmedInput) {
    return '';
  }

  try {
    const parsedUrl = new URL(trimmedInput);
    return parsedUrl.searchParams.get('certificateId') || trimmedInput;
  } catch {
    return trimmedInput;
  }
}

export default function VerifyPage() {
  const [certificateId, setCertificateId] = useState('');
  const [certificate, setCertificate] = useState(null);
  const [verification, setVerification] = useState(null);
  const [uploadVerification, setUploadVerification] = useState(null);
  const [uploadJson, setUploadJson] = useState('');
  const [uploadForm, setUploadForm] = useState({
    certificateId: '',
    name: '',
    course: '',
    issueDate: new Date().toISOString().slice(0, 10)
  });
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [scanLoading, setScanLoading] = useState(false);
  const [fraudStatus, setFraudStatus] = useState({ suspicious: false, attempts: 0, riskLevel: 'low' });
  const [showAlert, setShowAlert] = useState(true);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const seededCertificateId = searchParams.get('certificateId') || '';
    if (seededCertificateId) {
      setCertificateId(seededCertificateId);
      runVerification(seededCertificateId);
    }
  }, []);

  useEffect(() => {
    if (!fraudStatus.suspicious) {
      return;
    }

    setShowAlert(true);

    const timerId = setTimeout(() => {
      setShowAlert(false);
    }, 5000);

    return () => clearTimeout(timerId);
  }, [fraudStatus.suspicious, fraudStatus.attempts, fraudStatus.riskLevel]);

  async function runVerification(rawCertificateId) {
    const resolvedCertificateId = extractCertificateId(rawCertificateId || certificateId);
    if (!resolvedCertificateId) {
      setError('Enter a certificate ID or paste the verification URL from the QR code.');
      return;
    }

    setLoading(true);
    setError('');
    setVerification(null);
    setCertificate(null);
    setFraudStatus({ suspicious: false, attempts: 0, riskLevel: 'low' });

    try {
      const response = await verifyCertificate({ certificateId: resolvedCertificateId });
      setVerification(response);
      setCertificate(response.data.certificate);
      if (response.fraudStatus) {
        setFraudStatus(response.fraudStatus);
      } else if (response.status !== 'valid') {
        const fraudResponse = await fetchFraudStatus();
        setFraudStatus(fraudResponse.data || { suspicious: false, attempts: 0, riskLevel: 'low' });
      }
    } catch (verifyError) {
      setError(verifyError.message);
      setCertificate(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(event) {
    event.preventDefault();
    await runVerification(certificateId);
  }

  async function simulateQrScan() {
    setScanLoading(true);
    setError('');
    try {
      const statsResponse = await fetchDashboardStats();
      const latestId = statsResponse.data?.latestCertificates?.[0]?.certificateId || demoCertificates[0];
      setCertificateId(latestId);
      await runVerification(latestId);
    } catch (scanError) {
      setError(scanError.message || 'Scan simulation failed');
    } finally {
      setScanLoading(false);
    }
  }

  async function handleUploadVerify(event) {
    event.preventDefault();
    setUploadLoading(true);
    setUploadError('');
    setUploadVerification(null);

    try {
      const payload = uploadJson.trim()
        ? { certificateJson: uploadJson }
        : {
            certificateData: {
              certificateId: uploadForm.certificateId,
              name: uploadForm.name,
              course: uploadForm.course,
              issueDate: uploadForm.issueDate
            }
          };

      const response = await uploadVerifyCertificate(payload);
      setUploadVerification(response);
      if (response.data?.certificate) {
        setCertificate(response.data.certificate);
      }
      if (response.fraudStatus) {
        setFraudStatus(response.fraudStatus);
      }
    } catch (uploadVerifyError) {
      setUploadError(uploadVerifyError.message || 'Upload verification failed');
      setCertificate(null);
    } finally {
      setUploadLoading(false);
    }
  }

  async function loadCertificate() {
    const resolvedCertificateId = extractCertificateId(certificateId);
    if (!resolvedCertificateId) {
      return;
    }

    try {
      const response = await fetchCertificateById(resolvedCertificateId);
      setCertificate(response.data);
    } catch {
      setCertificate(null);
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadCertificate();
    }, 300);

    return () => clearTimeout(timeout);
  }, [certificateId]);

  return (
    <main className="space-y-6">
      {fraudStatus.suspicious && showAlert ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-red-300 bg-red-50 p-4 text-red-700 fade-warning">
          <span>🚨 Suspicious activity detected - failed attempts: {fraudStatus.attempts} (risk: {fraudStatus.riskLevel})</span>
          <button
            type="button"
            onClick={() => setShowAlert(false)}
            className="rounded-md px-2 py-1 text-sm font-semibold text-red-700 transition hover:bg-red-100 hover:text-red-800"
            aria-label="Dismiss suspicious activity alert"
          >
            ✖
          </button>
        </div>
      ) : null}

      <section className="grid-pattern glass-panel rounded-xl p-8 fade-in-up">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-700">Verification Console</p>
        <h1 className="mt-3 text-4xl font-black text-slateui-900 sm:text-5xl">Verify any certificate in one click.</h1>
        <p className="mt-4 max-w-2xl text-slateui-600">
          Paste a certificate ID or scan the QR code. The system fetches the stored record, recalculates the SHA-256 hash, and compares it against the blockchain record.
        </p>

        <form onSubmit={handleVerify} className="mt-8 flex flex-col gap-4 md:flex-row">
          <input
            value={certificateId}
            onChange={(event) => setCertificateId(event.target.value)}
            placeholder="Paste certificate ID or QR verification URL"
            className="w-full flex-1 rounded-xl border border-slateui-200 bg-white px-4 py-3 text-slateui-900 outline-none transition placeholder:text-slateui-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <button type="submit" disabled={loading} className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? 'Verifying on ledger...' : 'Verify Certificate'}
          </button>
        </form>

        <div className="mt-4 flex flex-wrap gap-3">
          {demoCertificates.map((demoId) => (
            <button
              key={demoId}
              type="button"
              onClick={() => setCertificateId(demoId)}
              className="rounded-full border border-slateui-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slateui-600 transition hover:border-slateui-300 hover:bg-slateui-50"
            >
              Load {demoId}
            </button>
          ))}
          <button
            type="button"
            onClick={simulateQrScan}
            disabled={scanLoading}
            className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {scanLoading ? 'Scanning...' : 'Simulate QR Scan'}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-3 text-xs uppercase tracking-[0.25em] text-slateui-500">
          <span>Student scan</span>
          <span>Admin issuance</span>
          <span>Employer check</span>
        </div>

        {error ? <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div> : null}
      </section>

      {verification ? (
        <section className="mt-8 space-y-5">
          <ResultAlert
            result={verification}
          />

          <CertificateCard certificate={certificate} verificationUrl={`${window.location.origin}/verify?certificateId=${encodeURIComponent(certificate?.certificateId || '')}`} />
        </section>
      ) : null}

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="glass-panel rounded-xl p-6 fade-in-up">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slateui-500">Upload and verify existing certificate</p>
          <h2 className="mt-2 text-2xl font-bold text-slateui-900">JSON upload or manual input</h2>
          <p className="mt-3 text-sm text-slateui-600">Submit a certificate payload. CrediChain regenerates the hash and compares it with stored records.</p>

          <form onSubmit={handleUploadVerify} className="mt-5 space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slateui-500">Certificate JSON (optional)</span>
              <textarea
                value={uploadJson}
                onChange={(event) => setUploadJson(event.target.value)}
                placeholder='{"certificateId":"CRD-DEMO-001","name":"Ava Johnson","course":"Advanced Blockchain Development","issueDate":"2026-04-14"}'
                className="h-32 w-full rounded-xl border border-slateui-200 bg-white px-4 py-3 text-sm text-slateui-900 outline-none transition placeholder:text-slateui-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <UploadField label="Certificate ID" value={uploadForm.certificateId} onChange={(value) => setUploadForm((prev) => ({ ...prev, certificateId: value }))} />
              <UploadField label="Name" value={uploadForm.name} onChange={(value) => setUploadForm((prev) => ({ ...prev, name: value }))} />
              <UploadField label="Course" value={uploadForm.course} onChange={(value) => setUploadForm((prev) => ({ ...prev, course: value }))} />
              <UploadField label="Issue Date" type="date" value={uploadForm.issueDate} onChange={(value) => setUploadForm((prev) => ({ ...prev, issueDate: value }))} />
            </div>

            <button type="submit" disabled={uploadLoading} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
              {uploadLoading ? 'Verifying Upload...' : 'Upload and Verify'}
            </button>
          </form>

          {uploadError ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{uploadError}</div> : null}
        </div>

        <div className="glass-panel rounded-xl p-6 fade-in-up">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slateui-500">Upload verification result</p>
          {uploadVerification ? (
            <>
              <ResultAlert
                result={uploadVerification}
              />
              <div className="mt-4 text-xs uppercase tracking-[0.2em] text-slateui-500">
                Output: {formatVerificationStatus(uploadVerification.status)}
              </div>
            </>
          ) : (
            <p className="mt-4 text-sm text-slateui-500">No upload verification yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}

function UploadField({ label, value, onChange, type = 'text' }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slateui-500">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slateui-200 bg-white px-4 py-3 text-sm text-slateui-900 outline-none transition placeholder:text-slateui-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </label>
  );
}

function formatVerificationStatus(status) {
  const normalizedStatus = String(status || '').toLowerCase();

  if (normalizedStatus === 'valid') {
    return 'VALID';
  }

  if (normalizedStatus === 'tampered') {
    return 'TAMPERED';
  }

  if (normalizedStatus === 'forged') {
    return 'FORGED';
  }

  if (normalizedStatus === 'suspicious') {
    return 'SUSPICIOUS';
  }

  if (normalizedStatus === 'not_found') {
    return 'NOT FOUND';
  }

  return normalizedStatus.toUpperCase();
}