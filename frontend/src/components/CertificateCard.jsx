import QRViewer from './QRViewer';

export default function CertificateCard({ certificate, verificationUrl, verificationStatus, onDownloadCertificate }) {
  if (!certificate) {
    return null;
  }

  const statusLabel = verificationStatus || inferCertificateStatus(certificate);
  const statusTone = statusLabel === 'TAMPERED'
    ? 'bg-red-50 text-red-700 border-red-200'
    : statusLabel === 'VERIFIED'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : 'bg-amber-50 text-amber-700 border-amber-200';

  return (
    <div className="grid gap-5 lg:grid-cols-[1.4fr_0.9fr] fade-in-up">
      <div className="glass-panel rounded-xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-700">Blockchain Certificate</p>
            <h3 className="mt-2 text-2xl font-bold text-slateui-900">{certificate.name}</h3>
            <p className="mt-1 text-slateui-600">{certificate.course}</p>
          </div>

          <div className="space-y-2">
            <div className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              ID: {certificate.certificateId}
            </div>
            <div className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusTone}`}>
              Status: {statusLabel}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Verified Issuer: {certificate.issuer || 'CrediChain Institute'}
        </div>

        <div className="mt-3 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
          Verified by CrediChain
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <InfoBlock label="Issue Date" value={certificate.issueDate} />
          <InfoBlock label="Issuer" value={certificate.issuer || 'CrediChain Institute'} />
          <InfoBlock label="Hash" value={certificate.hash} mono />
          <InfoBlock label="Digital Signature" value={certificate.digitalSignature || 'Not available'} mono />
          <InfoBlock label="Blockchain Tx" value={certificate.blockchainTransactionHash} mono />
          <InfoBlock label="Public Key" value={certificate.publicKey ? 'Loaded (RSA-2048)' : 'Not available'} />
        </div>

        <div className="mt-6 rounded-xl bg-slateui-50 p-4">
          <div className="grid gap-3 md:grid-cols-3">
            <MiniStat label="Verifications" value={certificate.verificationCount ?? 0} />
            <MiniStat label="Valid" value={certificate.validVerifications ?? 0} tone="text-emerald-300" />
            <MiniStat label="Tamper Attempts" value={certificate.tamperAttempts ?? 0} tone="text-rose-300" />
          </div>
        </div>

        {onDownloadCertificate ? (
          <div className="mt-5">
            <button
              type="button"
              onClick={onDownloadCertificate}
              className="rounded-full bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              Download Certificate
            </button>
          </div>
        ) : null}
      </div>

      <QRViewer qrCodeDataUrl={certificate.qrCodeDataUrl} verificationUrl={verificationUrl} />
    </div>
  );
}

function InfoBlock({ label, value, mono = false }) {
  return (
    <div className="rounded-xl border border-slateui-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slateui-500">{label}</p>
      <p className={`mt-2 break-words ${mono ? 'font-mono text-sm text-slateui-700' : 'text-base text-slateui-900'}`}>{value}</p>
    </div>
  );
}

function MiniStat({ label, value, tone = 'text-slate-100' }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slateui-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}

function inferCertificateStatus(certificate) {
  if (certificate.lastVerificationResult === 'INVALID' || (certificate.tamperAttempts || 0) > 0) {
    return 'TAMPERED';
  }

  if ((certificate.validVerifications || 0) > 0 || certificate.lastVerificationResult === 'VALID') {
    return 'VERIFIED';
  }

  return 'ISSUED';
}