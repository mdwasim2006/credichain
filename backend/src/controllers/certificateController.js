const PDFDocument = require('pdfkit');
const { appendCertificateRecord, getLedgerSnapshot } = require('../services/blockchainService');
const { createCertificateId, generateCertificateHash, normalizeIssueDate, normalizeText } = require('../services/hashService');
const { generateQrCodeDataUrl } = require('../services/qrService');
const { getPublicKeyPem, signCertificatePayload } = require('../services/signatureService');
const {
  createCertificate: storeCreateCertificate,
  countCertificates,
  findCertificateById,
  listCertificates
} = require('../services/certificateStore');
const { getVerificationStatsSnapshot, incrementTotalCertificates } = require('../services/verificationStatsService');

function buildCertificatePayload(body) {
  return {
    certificateId: normalizeText(body.certificateId),
    name: normalizeText(body.name),
    course: normalizeText(body.course),
    issueDate: normalizeIssueDate(body.issueDate || body.date)
  };
}

function buildVerificationUrl(certificateId) {
  const publicBackendUrl = process.env.PUBLIC_BACKEND_URL || process.env.BACKEND_PUBLIC_URL || '';
  const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  if (publicBackendUrl) {
    return `${publicBackendUrl.replace(/\/$/, '')}/verify/${encodeURIComponent(certificateId)}`;
  }

  return `${frontendBaseUrl.replace(/\/$/, '')}/verify?certificateId=${encodeURIComponent(certificateId)}`;
}

async function createCertificate(req, res) {
  try {
    const { issuer = 'CrediChain Institute' } = req.body;
    const normalizedPayload = buildCertificatePayload(req.body);

    if (!normalizedPayload.name || !normalizedPayload.course || !normalizedPayload.issueDate) {
      return res.status(400).json({
        success: false,
        message: 'name, course, and issueDate are required'
      });
    }

    const certificateId = normalizedPayload.certificateId || createCertificateId();
    const certificatePayload = {
      ...normalizedPayload,
      certificateId
    };

    const hash = generateCertificateHash(certificatePayload);
    const signablePayload = {
      ...certificatePayload,
      hash
    };
    const digitalSignature = signCertificatePayload(signablePayload);
    const blockchainRecord = appendCertificateRecord({
      certificateId,
      hash,
      issuer
    });

    const verificationUrl = buildVerificationUrl(certificateId);
    const qrCodeDataUrl = await generateQrCodeDataUrl(verificationUrl);

    const certificate = await storeCreateCertificate({
      certificateId,
      name: certificatePayload.name,
      course: certificatePayload.course,
      issueDate: certificatePayload.issueDate,
      issuer,
      hash,
      digitalSignature,
      issuerPublicKey: getPublicKeyPem(),
      publicKey: getPublicKeyPem(),
      qrCode: qrCodeDataUrl,
      qrCodeDataUrl,
      blockchainRecordId: String(blockchainRecord.blockNumber),
      blockchainTransactionHash: blockchainRecord.transactionHash,
      blockchainTimestamp: blockchainRecord.timestamp,
    });

    await incrementTotalCertificates(1);

    return res.status(201).json({
      success: true,
      message: 'Certificate created successfully',
      data: certificate,
      verificationUrl
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Certificate ID already exists. Please generate a new one.'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to create certificate',
      error: error.message
    });
  }
}

async function getCertificateById(req, res) {
  try {
    const certificate = await findCertificateById(req.params.id);

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    return res.json({
      success: true,
      data: certificate
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch certificate',
      error: error.message
    });
  }
}

async function getCertificates(req, res) {
  try {
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isNaN(requestedLimit) ? 50 : Math.max(1, Math.min(requestedLimit, 200));
    const certificates = await listCertificates(limit);

    return res.json({
      success: true,
      data: certificates
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch certificates',
      error: error.message
    });
  }
}

async function getDashboardStats(req, res) {
  try {
    const [totalCertificates, latestCertificates, totals] = await Promise.all([
      countCertificates(),
      listCertificates(5),
      getVerificationStatsSnapshot()
    ]);

    return res.json({
      success: true,
      data: {
        totalCertificates: Math.max(totalCertificates, Number(totals.totalCertificates || 0)),
        blockchainRecords: getLedgerSnapshot().length,
        totalVerifications: totals.totalVerifications || 0,
        validChecks: totals.validChecks || 0,
        validVerifications: totals.validChecks || 0,
        tamperAttempts: totals.tamperedAttempts || 0,
        fraudAttempts: totals.fraudAttempts || 0,
        suspiciousAlerts: totals.suspiciousAlerts || 0,
        notFoundChecks: totals.fraudAttempts || 0,
        auditTrail: totals.auditTrail || [],
        latestCertificates
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to load dashboard stats',
      error: error.message
    });
  }
}

function getBlockchainRecords(req, res) {
  try {
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isNaN(requestedLimit) ? 12 : Math.max(1, Math.min(requestedLimit, 100));
    const records = getLedgerSnapshot().slice().reverse().slice(0, limit);

    return res.json({
      success: true,
      data: {
        count: records.length,
        records
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to load blockchain records',
      error: error.message
    });
  }
}

function dataUrlToBuffer(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') {
    return null;
  }

  const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!matches) {
    return null;
  }

  return Buffer.from(matches[2], 'base64');
}

function renderCertificatePdf(doc, certificate, verificationUrl, qrBuffer) {
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;

  doc.rect(24, 24, pageWidth - 48, pageHeight - 48).lineWidth(2).stroke('#1e3a8a');
  doc.rect(34, 34, pageWidth - 68, pageHeight - 68).lineWidth(1).stroke('#64748b');

  doc.fontSize(14).fillColor('#1d4ed8').text('BLOCKCHAIN VERIFIED CERTIFICATE', 0, 68, { align: 'center' });
  doc.moveDown(0.6);

  doc.fontSize(30).fillColor('#0f172a').text('Certificate of Completion', { align: 'center' });
  doc.moveDown(0.8);

  doc.fontSize(16).fillColor('#334155').text('CrediChain Institute', { align: 'center' });
  doc.moveDown(0.4);
  doc.fontSize(13).fillColor('#475569').text('This certifies that', { align: 'center' });
  doc.moveDown(0.3);

  doc.fontSize(34).fillColor('#111827').text(certificate.name, { align: 'center' });
  doc.moveDown(0.4);

  doc.fontSize(18).fillColor('#1f2937').text(certificate.course, { align: 'center' });
  doc.moveDown(0.9);

  const badgeWidth = 190;
  const badgeX = (pageWidth - badgeWidth) / 2;
  const badgeY = doc.y;
  doc.roundedRect(badgeX, badgeY, badgeWidth, 24, 12).fill('#dcfce7');
  doc.fillColor('#166534').fontSize(10).text('Verified by CrediChain', badgeX, badgeY + 7, {
    width: badgeWidth,
    align: 'center'
  });

  doc.y = badgeY + 42;

  const contentY = doc.y;
  const qrSize = 112;
  const qrX = pageWidth - qrSize - 84;
  const textX = 86;
  const textWidth = pageWidth - qrSize - 190;

  doc.fontSize(11).fillColor('#1f2937').text(`Issue Date: ${certificate.issueDate}`, textX, contentY, { width: textWidth });
  doc.text(`Certificate ID: ${certificate.certificateId}`, textX, contentY + 24, { width: textWidth });
  doc.text(`Issuer: ${certificate.issuer || 'CrediChain Institute'}`, textX, contentY + 48, { width: textWidth });

  if (qrBuffer) {
    doc.image(qrBuffer, qrX, contentY - 6, { fit: [qrSize, qrSize] });
  }

  const footerY = Math.max(contentY + 130, 535);
  const signaturePreview = String(certificate.digitalSignature || 'RSA-SHA256-SIGNATURE').slice(0, 70);
  const hashPreview = String(certificate.hash || '').slice(0, 90);

  doc.fontSize(10).fillColor('#334155').text(`Hash: ${hashPreview}`, 70, footerY, {
    width: pageWidth - 140,
    align: 'left'
  });
  doc.text(`Digital Signature: ${signaturePreview}`, 70, footerY + 18, {
    width: pageWidth - 140,
    align: 'left'
  });
  doc.text('RSA-2048', 70, footerY + 36, { width: pageWidth - 140, align: 'left' });

  doc.fontSize(9).fillColor('#64748b').text(`Verification URL: ${verificationUrl}`, 70, pageHeight - 86, {
    width: pageWidth - 140,
    align: 'left'
  });
}

async function generateCertificatePdf(req, res) {
  try {
    const requestedId = normalizeText(req.body.certificateId);
    const storedCertificate = requestedId ? await findCertificateById(requestedId) : null;

    const certificate = storedCertificate || {
      certificateId: normalizeText(req.body.certificateId) || createCertificateId(),
      name: normalizeText(req.body.name),
      course: normalizeText(req.body.course),
      issueDate: normalizeIssueDate(req.body.issueDate || req.body.date),
      issuer: normalizeText(req.body.issuer) || 'CrediChain Institute',
      digitalSignature: normalizeText(req.body.digitalSignature) || 'Simulated-Signature-Verified',
      issuerPublicKey: normalizeText(req.body.issuerPublicKey) || normalizeText(req.body.publicKey),
      publicKey: normalizeText(req.body.publicKey) || normalizeText(req.body.issuerPublicKey),
      qrCode: normalizeText(req.body.qrCode) || normalizeText(req.body.qrCodeDataUrl),
      qrCodeDataUrl: normalizeText(req.body.qrCodeDataUrl) || normalizeText(req.body.qrCode),
      hash: normalizeText(req.body.hash)
    };

    if (!certificate.name || !certificate.course || !certificate.issueDate) {
      return res.status(400).json({
        success: false,
        message: 'name, course, and issueDate are required to generate PDF'
      });
    }

    const verificationUrl = buildVerificationUrl(certificate.certificateId);
    const qrCodeDataUrl = certificate.qrCodeDataUrl || certificate.qrCode || await generateQrCodeDataUrl(verificationUrl);
    const qrBuffer = dataUrlToBuffer(qrCodeDataUrl);

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const safeFileName = String(certificate.certificateId || 'certificate').replace(/[^a-zA-Z0-9-_]/g, '_');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFileName}.pdf"`);

    doc.pipe(res);
    renderCertificatePdf(doc, certificate, verificationUrl, qrBuffer);
    doc.end();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to generate certificate PDF',
      error: error.message
    });
  }
}

async function downloadCertificatePdfById(req, res) {
  try {
    const certificateId = normalizeText(req.params.id);

    if (!certificateId) {
      return res.status(400).json({
        success: false,
        message: 'certificate id is required'
      });
    }

    const certificate = await findCertificateById(certificateId);

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    const verificationUrl = buildVerificationUrl(certificate.certificateId);
    const qrCodeDataUrl = certificate.qrCodeDataUrl || certificate.qrCode || await generateQrCodeDataUrl(verificationUrl);
    const qrBuffer = dataUrlToBuffer(qrCodeDataUrl);

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=certificate.pdf');

    doc.pipe(res);
    renderCertificatePdf(doc, certificate, verificationUrl, qrBuffer);
    doc.end();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to download certificate PDF',
      error: error.message
    });
  }
}

module.exports = {
  createCertificate,
  downloadCertificatePdfById,
  generateCertificatePdf,
  getCertificates,
  getCertificateById,
  getDashboardStats,
  getBlockchainRecords
};
