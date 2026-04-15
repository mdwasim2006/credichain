const crypto = require('crypto');

function normalizeText(value) {
  return String(value ?? '').trim();
}

function normalizeIssueDate(value) {
  const dateValue = normalizeText(value);
  if (!dateValue) {
    return '';
  }

  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return dateValue;
  }

  return parsedDate.toISOString().slice(0, 10);
}

function buildCanonicalPayload(certificateData) {
  return {
    certificateId: normalizeText(certificateData.certificateId),
    name: normalizeText(certificateData.name),
    course: normalizeText(certificateData.course),
    issueDate: normalizeIssueDate(certificateData.issueDate)
  };
}

function generateCertificateHash(certificateData) {
  const canonicalPayload = buildCanonicalPayload(certificateData);
  const canonicalString = JSON.stringify(canonicalPayload);

  return crypto.createHash('sha256').update(canonicalString).digest('hex');
}

function createCertificateId() {
  return `CRD-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().split('-')[0].toUpperCase()}`;
}

module.exports = {
  buildCanonicalPayload,
  createCertificateId,
  generateCertificateHash,
  normalizeIssueDate,
  normalizeText
};