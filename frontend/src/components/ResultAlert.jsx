export default function ResultAlert({
  result,
  status,
  message,
  reason,
  warningMessage,
  trustScore,
  storedHash,
  recalculatedHash,
  signatureValid,
  proofData
}) {
  const resolvedStatus = String(result?.status || status || '').toLowerCase();
  const certificateExists = Boolean(result?.data?.certificate);

  if (!resolvedStatus) {
    return null;
  }

  const resolvedReason = result?.reason || reason || message || statusLabelByValue(resolvedStatus);
  const resolvedWarningMessage = result?.warningMessage || warningMessage || resolvedReason;
  const resolvedTrustScore = Number.isFinite(Number(result?.trustScore ?? trustScore)) ? Number(result?.trustScore ?? trustScore) : trustScoreForStatus(resolvedStatus);
  const signatureStatus = String(result?.signatureStatus || '').toLowerCase() || resolveSignatureStatus({ result, status: resolvedStatus, signatureValid });
  const proof = result?.data?.proof || proofData || {};
  const proofStoredHash = result?.data?.storedHash || storedHash || proof.storedHash || '';
  const proofGeneratedHash = result?.data?.recalculatedHash || result?.data?.generatedHash || recalculatedHash || proof.generatedHash || '';
  const proofSignatureValid = typeof proof.signatureValid === 'boolean' ? proof.signatureValid : Boolean(signatureValid);
  const modifiedFields = certificateExists ? (proof.modifiedFields || result?.data?.modifiedFields || []) : [];
  const hashMismatch = certificateExists
    ? Boolean(proof.hashMismatch ?? (proofStoredHash && proofGeneratedHash && proofStoredHash !== proofGeneratedHash))
    : false;

  const tone = toneByStatus(resolvedStatus);
  const statusLabel = statusLabelByValue(resolvedStatus);
  const statusIcon = iconByStatus(resolvedStatus);
  const signatureTone = toneBySignature(signatureStatus);
  const proofAvailable = certificateExists && Boolean(proofStoredHash || proofGeneratedHash);
  return (
    <section className={`rounded-xl border p-5 shadow-sm transition hover:shadow-md ${tone.container}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-full border ${tone.badge}`}>
            <span className="text-base font-black">{statusIcon}</span>
          </div>
          <div>
            <p className={`text-sm uppercase tracking-wide ${tone.label}`}>{statusLabel}</p>
            <h3 className={`mt-1 text-xl font-semibold ${tone.title}`}>{resolvedReason}</h3>
            <p className={`mt-2 text-sm ${tone.body}`}>{resolvedWarningMessage}</p>
          </div>
        </div>

        <div className={`rounded-xl border px-4 py-3 text-right ${tone.badgePanel}`}>
          <p className={`text-xs uppercase tracking-[0.25em] ${tone.panelLabel}`}>Trust score</p>
          <p className={`mt-1 text-2xl font-semibold ${tone.panelValue}`}>{resolvedTrustScore}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <MetricPill label="Status" value={statusLabel} tone={tone.metric} />
        <MetricPill label="Reason" value={resolvedReason} tone={tone.metric} />
      </div>

      <div className={`mt-4 rounded-xl border p-4 ${certificateExists ? (hashMismatch ? 'border-red-300 bg-red-50' : 'border-slateui-200 bg-slateui-50') : 'border-amber-200 bg-amber-50'}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-slateui-500">Proof section</p>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${signatureTone.badge}`}>
            {signatureLabel(signatureStatus)}
          </span>
        </div>

        {!certificateExists ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-white p-4 text-sm text-amber-800">
            No proof data available. Proof is only shown when a certificate record exists.
          </div>
        ) : proofAvailable ? (
          <>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <ProofBlock label="Stored Hash" value={proofStoredHash} highlight={hashMismatch} />
              <ProofBlock label="Generated Hash" value={proofGeneratedHash} highlight={hashMismatch} />
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${hashMismatch ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {hashMismatch ? '❌ Mismatch' : '✔ Match'}
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${proofSignatureValid ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                {proofSignatureValid ? '✔ Signature Verified' : '❌ Signature Verification Failed'}
              </span>
            </div>

            {hashMismatch ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-white p-3 text-sm text-red-700">
                <span className="font-semibold uppercase tracking-wide">Mismatch detected:</span> stored and generated hashes do not match.
              </div>
            ) : null}
          </>
        ) : (
          <div className="mt-4 rounded-xl border border-slateui-200 bg-white p-4 text-sm text-slateui-600">
            Proof data is unavailable for this verification result.
          </div>
        )}
      </div>

      {certificateExists && modifiedFields.length ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-red-700">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-red-100 text-red-700">!</span>
            Modified fields
          </div>

          <div className="mt-3 grid gap-3">
            {modifiedFields.map((field) => (
              <div key={field.key || field.field} className="grid gap-2 rounded-xl border border-red-200 bg-white p-3 md:grid-cols-[160px_1fr_1fr] md:items-center">
                <div className="text-sm font-semibold text-slateui-900">{field.label || field.field}</div>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wide text-slateui-500">Stored</p>
                  <p className="truncate font-mono text-sm text-slateui-700" title={field.storedValue}>{field.storedValue}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wide text-red-600">Modified</p>
                  <p className="truncate font-mono text-sm text-red-700" title={field.generatedValue}>{field.generatedValue}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function ProofBlock({ label, value, highlight }) {
  return (
    <div className={`rounded-xl border p-3 ${highlight ? 'border-red-200 bg-red-50' : 'border-slateui-200 bg-white'}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slateui-500">{label}</p>
      <p className={`mt-2 break-all font-mono text-xs ${highlight ? 'text-red-700' : 'text-slateui-800'}`}>{value}</p>
    </div>
  );
}

function MetricPill({ label, value, tone }) {
  return (
    <div className={`rounded-xl border px-4 py-3 ${tone}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value || '—'}</p>
    </div>
  );
}

function statusLabelByValue(status) {
  if (status === 'valid') {
    return 'VALID';
  }

  if (status === 'tampered') {
    return 'TAMPERED';
  }

  if (status === 'forged') {
    return 'FORGED';
  }

  if (status === 'suspicious') {
    return 'SUSPICIOUS';
  }

  if (status === 'not_found') {
    return 'NOT FOUND';
  }

  return String(status || '').toUpperCase();
}

function trustScoreForStatus(status) {
  if (status === 'valid') {
    return 100;
  }

  if (status === 'suspicious') {
    return 60;
  }

  if (status === 'tampered') {
    return 35;
  }

  if (status === 'forged') {
    return 20;
  }

  return 0;
}

function toneByStatus(status) {
  if (status === 'valid') {
    return {
      container: 'border-emerald-200 bg-emerald-50 text-emerald-800',
      badge: 'border-emerald-200 bg-emerald-100 text-emerald-700',
      badgePanel: 'border-emerald-200 bg-white',
      label: 'text-emerald-700',
      metric: 'border-emerald-200 bg-white text-emerald-700',
      title: 'text-emerald-900',
      body: 'text-emerald-700',
      panelLabel: 'text-slateui-500',
      panelValue: 'text-slateui-900'
    };
  }

  if (status === 'suspicious') {
    return {
      container: 'border-orange-200 bg-orange-50 text-orange-800',
      badge: 'border-orange-200 bg-orange-100 text-orange-700',
      badgePanel: 'border-orange-200 bg-white',
      label: 'text-orange-700',
      metric: 'border-orange-200 bg-white text-orange-700',
      title: 'text-orange-900',
      body: 'text-orange-700',
      panelLabel: 'text-slateui-500',
      panelValue: 'text-slateui-900'
    };
  }

  if (status === 'forged') {
    return {
      container: 'border-red-300 bg-red-950 text-red-50',
      badge: 'border-red-300 bg-red-900 text-red-100',
      badgePanel: 'border-red-300 bg-red-900/20',
      label: 'text-red-200',
      metric: 'border-red-800 bg-red-900/30 text-red-100',
      title: 'text-red-50',
      body: 'text-red-100',
      panelLabel: 'text-red-100',
      panelValue: 'text-red-50'
    };
  }

  if (status === 'tampered' || status === 'not_found') {
    return {
      container: 'border-red-200 bg-red-50 text-red-800',
      badge: 'border-red-200 bg-red-100 text-red-700',
      badgePanel: 'border-red-200 bg-white',
      label: 'text-red-700',
      metric: 'border-red-200 bg-white text-red-700',
      title: 'text-red-900',
      body: 'text-red-700',
      panelLabel: 'text-slateui-500',
      panelValue: 'text-slateui-900'
    };
  }

  return {
    container: 'border-slateui-200 bg-slateui-50 text-slateui-800',
    badge: 'border-slateui-200 bg-white text-slateui-700',
    badgePanel: 'border-slateui-200 bg-white',
    label: 'text-slateui-500',
    metric: 'border-slateui-200 bg-white text-slateui-700',
    title: 'text-slateui-900',
    body: 'text-slateui-600',
    panelLabel: 'text-slateui-500',
    panelValue: 'text-slateui-900'
  };
}

function iconByStatus(status) {
  if (status === 'valid') {
    return '✓';
  }

  if (status === 'suspicious') {
    return '!';
  }

  if (status === 'forged') {
    return '✕';
  }

  if (status === 'tampered') {
    return '!';
  }

  if (status === 'not_found') {
    return '?';
  }

  return '!';
}

function resolveSignatureStatus({ result, status, signatureValid }) {
  const certificateExists = Boolean(result?.data?.certificate);

  if (!certificateExists || status === 'not_found') {
    return 'not_available';
  }

  const hashMatch = Boolean(result?.data?.hashMatches);
  if (hashMatch && Boolean(signatureValid)) {
    return 'valid';
  }

  return 'invalid';
}

function signatureLabel(signatureStatus) {
  if (signatureStatus === 'valid') {
    return '✅ Signature Verified';
  }

  if (signatureStatus === 'not_available') {
    return '⚠ Signature Not Available';
  }

  return '❌ Signature Invalid';
}

function toneBySignature(signatureStatus) {
  if (signatureStatus === 'valid') {
    return {
      badge: 'bg-emerald-100 text-emerald-700 border-emerald-200'
    };
  }

  if (signatureStatus === 'not_available') {
    return {
      badge: 'bg-amber-100 text-amber-700 border-amber-200'
    };
  }

  return {
    badge: 'bg-red-100 text-red-700 border-red-200'
  };
}