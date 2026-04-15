import { useMemo, useState } from 'react';
import CertificateCard from '../components/CertificateCard';
import ResultAlert from '../components/ResultAlert';
import { createCertificate, downloadCertificateById, verifyCertificate } from '../services/api';

const emptyForm = () => ({
  certificateId: buildClientCertificateId(),
  name: 'Ava Johnson',
  course: 'Advanced Blockchain Development',
  issueDate: new Date().toISOString().slice(0, 10),
  issuer: 'CrediChain Institute'
});

export default function AdminPage() {
  const [form, setForm] = useState(emptyForm);
  const [createdCertificate, setCreatedCertificate] = useState(null);
  const [verificationUrl, setVerificationUrl] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [tamperForm, setTamperForm] = useState({ name: '', course: '', issueDate: '' });
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tamperMode, setTamperMode] = useState('original');

  const originalPayload = useMemo(() => {
    if (!createdCertificate) {
      return null;
    }

    return {
      certificateId: createdCertificate.certificateId,
      name: createdCertificate.name,
      course: createdCertificate.course,
      issueDate: createdCertificate.issueDate
    };
  }, [createdCertificate]);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });
    setVerificationResult(null);

    try {
      const response = await createCertificate(form);
      setCreatedCertificate(response.data);
      setVerificationUrl(response.verificationUrl);
      setTamperForm({
        name: response.data.name,
        course: response.data.course,
        issueDate: response.data.issueDate
      });
      window.dispatchEvent(new CustomEvent('credichain:certificates-updated', { detail: response.data }));
      setStatus({ type: 'success', message: 'Certificate Issued Successfully' });
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  }

  async function verifyCandidate(candidateData, label) {
    if (!createdCertificate) {
      return;
    }

    setLoading(true);
    setStatus({ type: '', message: '' });
    setVerificationResult(null);

    try {
      const response = await verifyCertificate({
        certificateId: createdCertificate.certificateId,
        certificateData: candidateData
      });

      setVerificationResult(response);
      const normalizedStatus = String(response.status || '').toLowerCase();
      setStatus({
        type: normalizedStatus === 'valid' ? 'success' : normalizedStatus === 'not_found' ? 'warning' : 'error',
        message: normalizedStatus === 'tampered' ? '❌ Tampered Certificate Detected' : `${label}: ${response.message}`
      });
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadCertificate() {
    if (!createdCertificate) {
      return;
    }

    try {
      await downloadCertificateById(createdCertificate.certificateId);

      setStatus({ type: 'success', message: 'Certificate PDF downloaded successfully.' });
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    }
  }

  return (
    <main className="space-y-6">
      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="grid-pattern glass-panel rounded-xl p-8 fade-in-up">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-700">Admin Panel</p>
          <h1 className="mt-3 text-4xl font-black text-slateui-900 sm:text-5xl">Issue a certificate in seconds.</h1>
          <p className="mt-4 max-w-2xl text-slateui-600">
            Enter the certificate details once. CrediChain hashes the record, stores it on the mock blockchain ledger, and generates a QR code for instant verification.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 grid gap-4 sm:grid-cols-2">
            <Field label="Certificate ID" value={form.certificateId} onChange={(value) => setForm((prev) => ({ ...prev, certificateId: value }))} placeholder="Auto-generated if blank" />
            <Field label="Name" value={form.name} onChange={(value) => setForm((prev) => ({ ...prev, name: value }))} />
            <Field label="Course" value={form.course} onChange={(value) => setForm((prev) => ({ ...prev, course: value }))} />
            <Field label="Date" type="date" value={form.issueDate} onChange={(value) => setForm((prev) => ({ ...prev, issueDate: value }))} />
            <Field label="Issuer" value={form.issuer} onChange={(value) => setForm((prev) => ({ ...prev, issuer: value }))} />

            <div className="sm:col-span-2 flex flex-wrap gap-3 pt-2">
              <button type="button" onClick={() => setForm(emptyForm())} className="rounded-full border border-slateui-200 bg-white px-5 py-3 text-sm font-semibold text-slateui-700 transition hover:border-slateui-300 hover:bg-slateui-50">
                Regenerate ID
              </button>
              <button type="submit" disabled={loading} className="rounded-full bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? 'Processing...' : 'Issue Certificate'}
              </button>
            </div>
          </form>

          {status.type ? <div className={`mt-6 rounded-xl border p-4 text-sm ${status.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : status.type === 'warning' ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-red-200 bg-red-50 text-red-700'}`}>{status.message}</div> : null}
        </div>

        <div className="space-y-5">
          {createdCertificate ? (
            <>
              <CertificateCard
                certificate={createdCertificate}
                verificationUrl={verificationUrl}
                onDownloadCertificate={handleDownloadCertificate}
              />
              <section className="glass-panel rounded-xl p-6 fade-in-up">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slateui-500">Tamper Detection Demo</p>
                    <h2 className="mt-2 text-2xl font-bold text-slateui-900">Change one field. The hash breaks.</h2>
                  </div>
                  <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">Winning demo</span>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <Field label="Tampered Name" value={tamperForm.name} onChange={(value) => setTamperForm((prev) => ({ ...prev, name: value }))} />
                  <Field label="Tampered Course" value={tamperForm.course} onChange={(value) => setTamperForm((prev) => ({ ...prev, course: value }))} />
                  <Field label="Tampered Issue Date" type="date" value={tamperForm.issueDate} onChange={(value) => setTamperForm((prev) => ({ ...prev, issueDate: value }))} />
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slateui-500">Tamper Simulation Mode</span>
                  <button
                    type="button"
                    onClick={() => setTamperMode('original')}
                    className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${tamperMode === 'original' ? 'bg-emerald-100 text-emerald-700' : 'bg-slateui-100 text-slateui-600 hover:bg-slateui-200'}`}
                  >
                    Original Data
                  </button>
                  <button
                    type="button"
                    onClick={() => setTamperMode('tampered')}
                    className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${tamperMode === 'tampered' ? 'bg-red-100 text-red-700' : 'bg-slateui-100 text-slateui-600 hover:bg-slateui-200'}`}
                  >
                    Tampered Data
                  </button>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => verifyCandidate(tamperMode === 'tampered' ? tamperForm : originalPayload, tamperMode === 'tampered' ? 'Simulated tampered data' : 'Original data')}
                    className={`rounded-full border px-5 py-3 text-sm font-semibold transition ${tamperMode === 'tampered' ? 'border-red-200 bg-red-600 text-white hover:bg-red-700' : 'border-emerald-200 bg-emerald-600 text-white hover:bg-emerald-700'}`}
                  >
                    {tamperMode === 'tampered' ? 'Simulate Tampering' : 'Verify Original Data'}
                  </button>
                </div>

                {verificationResult ? (
                  <div className="mt-5">
                    <ResultAlert
                      result={verificationResult}
                    />
                  </div>
                ) : null}
              </section>
            </>
          ) : (
            <div className="glass-panel rounded-xl p-6 text-slateui-600">
              Issue a certificate to unlock the QR and tamper demo.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slateui-700">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slateui-200 bg-white px-4 py-3 text-slateui-900 outline-none transition placeholder:text-slateui-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </label>
  );
}

function buildClientCertificateId() {
  const randomSegment = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID().split('-')[0].toUpperCase() : Math.random().toString(36).slice(2, 10).toUpperCase();
  return `CRD-${Date.now().toString(36).toUpperCase()}-${randomSegment}`;
}