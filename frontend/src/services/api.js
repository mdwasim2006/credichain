const API_BASE_URL = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '') || (import.meta.env.DEV ? '/api' : '');
const AUTH_TOKEN_KEY = 'credichain-token';
const ENABLE_OFFLINE_FALLBACK = Boolean(import.meta.env.DEV || !API_BASE_URL);
const FALLBACK_STORAGE_KEY = 'credichain-fallback-certificates';
const FALLBACK_STATS_KEY = 'credichain-fallback-stats';
const FALLBACK_AUDIT_KEY = 'credichain-fallback-audit';

function nowIso() {
  return new Date().toISOString();
}

function normalizeIssueDate(value) {
  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? String(value || '') : parsedDate.toISOString().slice(0, 10);
}

function buildFallbackCertificateId() {
  return `CRD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function canonicalizePayload(payload) {
  return {
    certificateId: String(payload.certificateId || '').trim(),
    name: String(payload.name || '').trim(),
    course: String(payload.course || '').trim(),
    issueDate: normalizeIssueDate(payload.issueDate)
  };
}

async function sha256Hex(value) {
  const encoded = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function generateHash(certificateData) {
  return sha256Hex(JSON.stringify(canonicalizePayload(certificateData)));
}

function readFallbackCertificates() {
  try {
    return JSON.parse(localStorage.getItem(FALLBACK_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function writeFallbackCertificates(certificates) {
  localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(certificates));
}

function getFallbackLedger() {
  try {
    return JSON.parse(localStorage.getItem('credichain-fallback-ledger') || '[]');
  } catch {
    return [];
  }
}

function writeFallbackLedger(records) {
  localStorage.setItem('credichain-fallback-ledger', JSON.stringify(records));
}

function getFallbackStats() {
  try {
    return JSON.parse(localStorage.getItem(FALLBACK_STATS_KEY) || '{"totalCertificates":0,"totalVerifications":0,"validChecks":0,"tamperAttempts":0,"fraudAttempts":0,"suspiciousAlerts":0,"auditTrail":[]}');
  } catch {
    return {
      totalCertificates: 0,
      totalVerifications: 0,
      validChecks: 0,
      tamperAttempts: 0,
      fraudAttempts: 0,
      suspiciousAlerts: 0,
      auditTrail: []
    };
  }
}

function getFallbackAuditTrail() {
  try {
    return JSON.parse(localStorage.getItem(FALLBACK_AUDIT_KEY) || '[]');
  } catch {
    return [];
  }
}

function writeFallbackAuditTrail(auditTrail) {
  localStorage.setItem(FALLBACK_AUDIT_KEY, JSON.stringify(auditTrail));
}

function toAuditStatusLabel(status) {
  if (status === 'valid') {
    return 'VALID';
  }

  if (status === 'tampered') {
    return 'TAMPERED';
  }

  return 'NOT FOUND';
}

function writeFallbackStats(stats) {
  localStorage.setItem(FALLBACK_STATS_KEY, JSON.stringify(stats));
}

function recordFallbackVerification(status, metadata = {}) {
  const stats = getFallbackStats();
  stats.totalVerifications += 1;
  if (status === 'valid') {
    stats.validChecks += 1;
  } else if (status === 'tampered') {
    stats.tamperAttempts += 1;
  } else if (status === 'not_found') {
    stats.fraudAttempts += 1;
  }

  const auditTrail = getFallbackAuditTrail();
  auditTrail.unshift({
    certificateId: metadata.certificateId || null,
    name: metadata.name || 'Unknown',
    status: toAuditStatusLabel(status),
    timestamp: nowIso()
  });
  const trimmedAuditTrail = auditTrail.slice(0, 100);
  writeFallbackAuditTrail(trimmedAuditTrail);
  const failedAttempts = trimmedAuditTrail.filter((entry) => entry.status === 'TAMPERED' || entry.status === 'NOT FOUND').length;
  stats.suspiciousAlerts = failedAttempts >= 3 ? 1 : 0;
  stats.auditTrail = trimmedAuditTrail;
  writeFallbackStats(stats);
  return stats;
}

function buildFallbackRecord(certificateId, hash, issuer = 'CrediChain Institute') {
  const ledger = getFallbackLedger();
  return {
    blockNumber: ledger.length + 1,
    certificateId,
    hash,
    issuer,
    previousHash: ledger.length > 0 ? ledger[ledger.length - 1].hash : 'GENESIS',
    transactionHash: `0x${Math.random().toString(16).slice(2, 18).padEnd(16, '0')}`,
    timestamp: nowIso()
  };
}

function buildFallbackQrSvg(certificateId) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320" fill="none">
      <rect width="320" height="320" rx="24" fill="#ffffff"/>
      <rect x="24" y="24" width="272" height="272" rx="18" fill="#0f172a"/>
      <rect x="40" y="40" width="72" height="72" rx="10" fill="#38bdf8"/>
      <rect x="208" y="40" width="72" height="72" rx="10" fill="#22c55e"/>
      <rect x="40" y="208" width="72" height="72" rx="10" fill="#f59e0b"/>
      <rect x="132" y="132" width="56" height="56" rx="14" fill="#ffffff"/>
      <text x="160" y="158" text-anchor="middle" fill="#0f172a" font-family="Arial, sans-serif" font-size="14" font-weight="700">OFFLINE</text>
      <text x="160" y="180" text-anchor="middle" fill="#0f172a" font-family="Arial, sans-serif" font-size="11">${certificateId}</text>
      <text x="160" y="294" text-anchor="middle" fill="#cbd5e1" font-family="Arial, sans-serif" font-size="10">Scan URL in browser verify tab</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function upsertFallbackCertificate(certificate) {
  const certificates = readFallbackCertificates();
  const index = certificates.findIndex((entry) => entry.certificateId === certificate.certificateId);

  if (index >= 0) {
    certificates[index] = certificate;
  } else {
    certificates.unshift(certificate);
  }

  writeFallbackCertificates(certificates);
  return certificate;
}

async function seedFallbackDemoCertificates() {
  const certificates = readFallbackCertificates();
  if (certificates.length > 0) {
    return certificates;
  }

  const demo = [
    {
      certificateId: 'CRD-DEMO-001',
      name: 'Ava Johnson',
      course: 'Advanced Blockchain Development',
      issueDate: '2026-04-14',
      issuer: 'CrediChain Institute'
    },
    {
      certificateId: 'CRD-DEMO-002',
      name: 'Noah Carter',
      course: 'Smart Contract Security',
      issueDate: '2026-04-14',
      issuer: 'CrediChain Institute'
    }
  ];

  const now = nowIso();
  const seeded = [];

  demo.forEach((item, index) => {
    const canonicalPayload = canonicalizePayload(item);
    seeded.push({
      ...item,
      _id: `fallback-${index + 1}`,
      hash: '',
      digitalSignature: '',
      publicKey: 'offline-public-key',
      blockchainRecordId: String(index + 1),
      blockchainTransactionHash: `0x${Math.random().toString(16).slice(2, 18).padEnd(16, '0')}`,
      blockchainTimestamp: now,
      qrCodeDataUrl: buildFallbackQrSvg(item.certificateId),
      verificationCount: 0,
      validVerifications: 0,
      tamperAttempts: 0,
      lastVerificationAt: null,
      lastVerificationResult: null,
      createdAt: now,
      updatedAt: now,
      canonicalPayload
    });
  });

  writeFallbackCertificates(seeded.map(({ canonicalPayload, ...certificate }) => certificate));

  const seededLedger = seeded.map((certificate, index) => ({
    blockNumber: index + 1,
    certificateId: certificate.certificateId,
    hash: '',
    issuer: certificate.issuer,
    previousHash: index === 0 ? 'GENESIS' : seeded[index - 1].hash || 'GENESIS',
    transactionHash: certificate.blockchainTransactionHash,
    timestamp: certificate.blockchainTimestamp
  }));

  writeFallbackLedger(seededLedger);

  for (const certificate of seeded) {
    const hash = await generateHash(certificate.canonicalPayload);
    const certificatesToPersist = readFallbackCertificates();
    const targetCertificate = certificatesToPersist.find((entry) => entry.certificateId === certificate.certificateId);
    if (targetCertificate) {
      targetCertificate.hash = hash;
      targetCertificate.digitalSignature = `offline-${hash}`;
      targetCertificate.updatedAt = nowIso();
    }
    writeFallbackCertificates(certificatesToPersist);

    const ledger = getFallbackLedger();
    const targetLedger = ledger.find((entry) => entry.certificateId === certificate.certificateId);
    if (targetLedger) {
      targetLedger.hash = hash;
      targetLedger.previousHash = ledger.find((entry) => entry.blockNumber === targetLedger.blockNumber - 1)?.hash || 'GENESIS';
    }
    writeFallbackLedger(ledger);
  }

  return readFallbackCertificates();
}

function getFallbackLatestCertificates(limit = 5) {
  return readFallbackCertificates().slice(0, limit);
}

function getFallbackTotals() {
  return readFallbackCertificates().reduce(
    (totals, certificate) => {
      totals.totalVerifications += certificate.verificationCount || 0;
      totals.validVerifications += certificate.validVerifications || 0;
      totals.tamperAttempts += certificate.tamperAttempts || 0;
      return totals;
    },
    { totalVerifications: 0, validVerifications: 0, tamperAttempts: 0 }
  );
}

async function createFallbackCertificate(payload) {
  const certificateId = payload.certificateId?.trim() || buildFallbackCertificateId();
  const canonicalPayload = {
    certificateId,
    name: String(payload.name || '').trim(),
    course: String(payload.course || '').trim(),
    issueDate: normalizeIssueDate(payload.issueDate)
  };
  const hash = await generateHash(canonicalPayload);
  const blockchainRecord = buildFallbackRecord(certificateId, hash, payload.issuer || 'CrediChain Institute');
  const certificate = {
    _id: crypto.randomUUID(),
    certificateId,
    name: canonicalPayload.name,
    course: canonicalPayload.course,
    issueDate: canonicalPayload.issueDate,
    issuer: payload.issuer || 'CrediChain Institute',
    hash,
    digitalSignature: `offline-${hash}`,
    publicKey: 'offline-public-key',
    blockchainRecordId: String(blockchainRecord.blockNumber),
    blockchainTransactionHash: blockchainRecord.transactionHash,
    blockchainTimestamp: blockchainRecord.timestamp,
    previousHash: blockchainRecord.previousHash,
    qrCodeDataUrl: buildFallbackQrSvg(certificateId),
    verificationCount: 0,
    validVerifications: 0,
    tamperAttempts: 0,
    lastVerificationAt: null,
    lastVerificationResult: null,
    createdAt: nowIso(),
    updatedAt: nowIso()
  };

  upsertFallbackCertificate(certificate);
  writeFallbackLedger([...getFallbackLedger(), blockchainRecord]);
  return certificate;
}

function findFallbackCertificateById(certificateId) {
  return readFallbackCertificates().find((certificate) => certificate.certificateId === certificateId) || null;
}

function updateFallbackVerification(certificateId, isValid) {
  const certificates = readFallbackCertificates();
  const certificate = certificates.find((item) => item.certificateId === certificateId);

  if (!certificate) {
    return null;
  }

  certificate.verificationCount = (certificate.verificationCount || 0) + 1;
  certificate.lastVerificationAt = nowIso();
  certificate.lastVerificationResult = isValid ? 'VALID' : 'INVALID';
  certificate.updatedAt = nowIso();
  if (isValid) {
    certificate.validVerifications = (certificate.validVerifications || 0) + 1;
  } else {
    certificate.tamperAttempts = (certificate.tamperAttempts || 0) + 1;
  }

  writeFallbackCertificates(certificates);
  return certificate;
}

async function tryApi(path, options = {}) {
  const authToken = localStorage.getItem(AUTH_TOKEN_KEY) || sessionStorage.getItem(AUTH_TOKEN_KEY);
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(options.headers || {})
    },
    ...options
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || 'Request failed');
  }

  return payload;
}

async function request(path, options = {}) {
  try {
    return await tryApi(path, options);
  } catch (error) {
    if (!ENABLE_OFFLINE_FALLBACK) {
      throw error;
    }

    return fallbackRequest(path, options, error);
  }
}

async function fallbackRequest(path, options = {}, originalError = null) {
  const method = String(options.method || 'GET').toUpperCase();
  await seedFallbackDemoCertificates();

  if (path === '/dashboard/stats' && method === 'GET') {
    const certificates = getFallbackLatestCertificates(5);
    const totals = getFallbackTotals();
    const globalStats = getFallbackStats();
    return {
      success: true,
      data: {
        totalCertificates: readFallbackCertificates().length,
        blockchainRecords: getFallbackLedger().length,
        totalVerifications: globalStats.totalVerifications || totals.totalVerifications,
        validChecks: globalStats.validChecks || totals.validVerifications,
        validVerifications: globalStats.validChecks || totals.validVerifications,
        tamperAttempts: globalStats.tamperAttempts || totals.tamperAttempts,
        fraudAttempts: globalStats.fraudAttempts || 0,
        suspiciousAlerts: globalStats.suspiciousAlerts || 0,
        notFoundChecks: globalStats.fraudAttempts || 0,
        auditTrail: globalStats.auditTrail || getFallbackAuditTrail(),
        latestCertificates: certificates
      }
    };
  }

  if (path === '/stats' && method === 'GET') {
    const statsResponse = await fallbackRequest('/dashboard/stats', { method: 'GET' }, originalError);
    return statsResponse;
  }

  if (path === '/fraud-status' && method === 'GET') {
    const stats = getFallbackStats();
    const failedAttempts = (stats.auditTrail || []).filter((entry) => entry.status === 'TAMPERED' || entry.status === 'NOT FOUND').length;
    return {
      success: true,
      data: {
        suspicious: failedAttempts >= 3,
        attempts: failedAttempts,
        riskLevel: failedAttempts >= 5 ? 'high' : failedAttempts >= 3 ? 'medium' : 'low'
      }
    };
  }

  if (path.startsWith('/certificates') && method === 'GET') {
    return {
      success: true,
      data: readFallbackCertificates()
    };
  }

  if (path.startsWith('/blockchain/records') && method === 'GET') {
    const records = getFallbackLedger().slice().reverse();
    return {
      success: true,
      data: {
        count: records.length,
        records
      }
    };
  }

  if (path.startsWith('/certificate/') && method === 'GET') {
    const certificateId = decodeURIComponent(path.split('/').pop() || '');
    const certificate = findFallbackCertificateById(certificateId);
    if (!certificate) {
      throw originalError || new Error('Certificate not found');
    }
    return { success: true, data: certificate };
  }

  if (path === '/create-certificate' && method === 'POST') {
    const payload = JSON.parse(options.body || '{}');
    if (!payload.name || !payload.course || !payload.issueDate) {
      throw new Error('name, course, and issueDate are required');
    }

    const createdCertificate = await createFallbackCertificate(payload);
    return {
      success: true,
      message: 'Certificate created successfully',
      data: createdCertificate,
      verificationUrl: `${window.location.origin}/verify?certificateId=${encodeURIComponent(createdCertificate.certificateId)}`
    };
  }

  if (path === '/auth/login' && method === 'POST') {
    const payload = JSON.parse(options.body || '{}');
    if (payload.username === 'admin' && payload.password === '1234') {
      const token = 'offline-admin-token';
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      sessionStorage.setItem(AUTH_TOKEN_KEY, token);
      return {
        success: true,
        token,
        user: { username: 'admin', role: 'admin' }
      };
    }

    throw new Error('Invalid credentials');
  }

  if (path === '/verify-certificate' && method === 'POST') {
    const payload = JSON.parse(options.body || '{}');
    const requestedCertificateId = String(payload.certificateId || '').trim();
    if (!requestedCertificateId) {
      throw new Error('certificateId is required');
    }

    const certificate = findFallbackCertificateById(requestedCertificateId);
    if (!certificate) {
      recordFallbackVerification('not_found', {
        certificateId: requestedCertificateId,
        name: 'Unknown'
      });
      return {
        success: true,
        status: 'not_found',
        message: 'CERTIFICATE NOT FOUND - Possible Fake',
        signatureValid: false,
        data: {
          certificateId: requestedCertificateId,
          certificate: null
        }
      };
    }

    const candidateData = payload.certificateData || payload.data || {
      certificateId: certificate.certificateId,
      name: certificate.name,
      course: certificate.course,
      issueDate: certificate.issueDate
    };
    const recalculatedHash = await generateHash(candidateData);
    const signatureValid = certificate.digitalSignature === `offline-${recalculatedHash}`;
    const blockchainRecord = getFallbackLedger().find((record) => record.certificateId === certificate.certificateId) || null;
    const isValid = recalculatedHash === certificate.hash && Boolean(blockchainRecord && blockchainRecord.hash === certificate.hash) && signatureValid;
    recordFallbackVerification(isValid ? 'valid' : 'tampered', {
      certificateId: certificate.certificateId,
      name: certificate.name
    });
    const updatedCertificate = updateFallbackVerification(certificate.certificateId, isValid);

    return {
      success: true,
      status: isValid ? 'valid' : 'tampered',
      message: isValid ? 'VALID CERTIFICATE' : 'TAMPERED CERTIFICATE DETECTED',
      signatureValid,
      data: {
        certificateId: certificate.certificateId,
        storedHash: certificate.hash,
        recalculatedHash,
        blockchainRecord,
        candidateData,
        certificate: updatedCertificate || certificate
      }
    };
  }

  if (path === '/upload-verify' && method === 'POST') {
    const payload = JSON.parse(options.body || '{}');
    let uploadedData = payload.certificateData || payload.data || {};

    if (payload.certificateJson) {
      try {
        uploadedData = typeof payload.certificateJson === 'string' ? JSON.parse(payload.certificateJson) : payload.certificateJson;
      } catch {
        throw new Error('Invalid JSON format in certificateJson');
      }
    }

    const candidateData = {
      certificateId: String(uploadedData.certificateId || payload.certificateId || '').trim(),
      name: String(uploadedData.name || payload.name || '').trim(),
      course: String(uploadedData.course || payload.course || '').trim(),
      issueDate: normalizeIssueDate(uploadedData.issueDate || payload.issueDate)
    };

    if (!candidateData.name || !candidateData.course || !candidateData.issueDate) {
      throw new Error('Uploaded certificate must include name, course, and issueDate');
    }

    const generatedHash = await generateHash(candidateData);
    let storedCertificate = candidateData.certificateId ? findFallbackCertificateById(candidateData.certificateId) : null;

    if (!storedCertificate) {
      storedCertificate = readFallbackCertificates().find((entry) => entry.hash === generatedHash) || null;
    }

    if (!storedCertificate) {
      recordFallbackVerification('not_found', {
        certificateId: candidateData.certificateId || null,
        name: candidateData.name || 'Unknown'
      });

      return {
        success: true,
        status: 'not_found',
        message: 'NOT FOUND',
        signatureValid: false,
        data: {
          uploadedData: candidateData,
          generatedHash,
          storedHash: null,
          hashMatches: false,
          certificate: null
        }
      };
    }

    const hashMatches = generatedHash === storedCertificate.hash;
    const signatureValid = storedCertificate.digitalSignature === `offline-${generatedHash}`;
    const isValid = hashMatches && signatureValid;
    recordFallbackVerification(isValid ? 'valid' : 'tampered', {
      certificateId: storedCertificate.certificateId,
      name: storedCertificate.name
    });
    const updatedCertificate = updateFallbackVerification(storedCertificate.certificateId, isValid);

    return {
      success: true,
      status: isValid ? 'valid' : 'tampered',
      message: isValid ? 'VALID' : 'TAMPERED',
      signatureValid,
      data: {
        certificateId: storedCertificate.certificateId,
        uploadedData: candidateData,
        generatedHash,
        storedHash: storedCertificate.hash,
        hashMatches,
        certificate: updatedCertificate || storedCertificate
      }
    };
  }

  throw originalError || new Error('Request failed');
}

export function createCertificate(payload) {
  return request('/create-certificate', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function fetchCertificateById(certificateId) {
  return request(`/certificate/${encodeURIComponent(certificateId)}`);
}

export function fetchCertificates(limit = 50) {
  return request(`/certificates?limit=${encodeURIComponent(limit)}`);
}

export function verifyCertificate(payload) {
  return request('/verify-certificate', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function loginAdmin(payload) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function fetchDashboardStats() {
  return request('/stats');
}

export function fetchStats() {
  return request('/stats');
}

export function fetchFraudStatus() {
  return request('/fraud-status');
}

export function uploadVerifyCertificate(payload) {
  return request('/upload-verify', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function fetchBlockchainRecords(limit = 12) {
  return request(`/blockchain/records?limit=${encodeURIComponent(limit)}`);
}

export async function downloadCertificateById(certificateId) {
  const certId = String(certificateId || '').trim();
  if (!certId) {
    throw new Error('Certificate ID is required for download');
  }

  const response = await fetch(`${API_BASE_URL}/download-certificate/${encodeURIComponent(certId)}`);

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    throw new Error(errorPayload.message || 'Failed to download certificate PDF');
  }

  const blob = await response.blob();
  const fileUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = fileUrl;
  anchor.download = 'certificate.pdf';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(fileUrl);
}

export async function downloadCertificatePdf(payload) {
  return downloadCertificateById(payload?.certificateId);
}

export function setAuthToken(token) {
  if (!token) {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    return;
  }

  localStorage.setItem(AUTH_TOKEN_KEY, token);
  sessionStorage.setItem(AUTH_TOKEN_KEY, token);
}

export { API_BASE_URL };