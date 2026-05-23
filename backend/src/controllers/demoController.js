const { appendCertificateRecord } = require('../services/blockchainService');
const { createCertificateId, generateCertificateHash } = require('../services/hashService');
const { generateQrCodeDataUrl } = require('../services/qrService');
const { getPublicKeyPem, signCertificatePayload } = require('../services/signatureService');
const { createCertificate, findCertificateById } = require('../services/certificateStore');

const demoCertificates = [
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

async function seedDemoCertificatesData() {
  const publicBackendUrl = process.env.PUBLIC_BACKEND_URL || process.env.BACKEND_PUBLIC_URL || '';
  const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const createdCertificates = [];

  for (const demoCertificate of demoCertificates) {
    const existingCertificate = await findCertificateById(demoCertificate.certificateId);
    if (existingCertificate) {
      createdCertificates.push(existingCertificate);
      continue;
    }

    const certificateId = demoCertificate.certificateId || createCertificateId();
    const hash = generateCertificateHash({
      certificateId,
      name: demoCertificate.name,
      course: demoCertificate.course,
      issueDate: demoCertificate.issueDate
    });
    const digitalSignature = signCertificatePayload({
      certificateId,
      name: demoCertificate.name,
      course: demoCertificate.course,
      issueDate: demoCertificate.issueDate,
      hash
    });

    const blockchainRecord = appendCertificateRecord({
      certificateId,
      hash,
      issuer: demoCertificate.issuer
    });

    const verificationUrl = publicBackendUrl
      ? `${publicBackendUrl.replace(/\/$/, '')}/verify/${encodeURIComponent(certificateId)}`
      : `${frontendBaseUrl.replace(/\/$/, '')}/verify?certificateId=${encodeURIComponent(certificateId)}`;
    const qrCodeDataUrl = await generateQrCodeDataUrl(verificationUrl);

    const created = await createCertificate({
      certificateId,
      name: demoCertificate.name,
      course: demoCertificate.course,
      issueDate: demoCertificate.issueDate,
      issuer: demoCertificate.issuer,
      hash,
      digitalSignature,
      issuerPublicKey: getPublicKeyPem(),
      publicKey: getPublicKeyPem(),
      qrCode: qrCodeDataUrl,
      blockchainRecordId: String(blockchainRecord.blockNumber),
      blockchainTransactionHash: blockchainRecord.transactionHash,
      blockchainTimestamp: blockchainRecord.timestamp,
      qrCodeDataUrl
    });

    createdCertificates.push(created);
  }

  return createdCertificates;
}

async function seedDemoCertificates(req, res) {
  try {
    const createdCertificates = await seedDemoCertificatesData();

    return res.status(201).json({
      success: true,
      message: 'Demo certificates seeded successfully',
      data: createdCertificates
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to seed demo certificates',
      error: error.message
    });
  }
}

module.exports = {
  seedDemoCertificates,
  seedDemoCertificatesData
};