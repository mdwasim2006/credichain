const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const Certificate = require('../models/Certificate');
const { generateCertificateHash } = require('./hashService');
const { getPublicKeyPem, signCertificatePayload } = require('./signatureService');

const memoryCertificates = [];
let storeMode = 'mongo';
const memoryStoreFilePath = path.join(__dirname, '..', '..', 'data', 'memory-store.json');

function ensureMemoryStoreFile() {
  const directoryPath = path.dirname(memoryStoreFilePath);
  fs.mkdirSync(directoryPath, { recursive: true });

  if (!fs.existsSync(memoryStoreFilePath)) {
    fs.writeFileSync(memoryStoreFilePath, JSON.stringify({ certificates: [] }, null, 2), 'utf8');
  }
}

function loadMemoryStore() {
  try {
    ensureMemoryStoreFile();
    const rawContent = fs.readFileSync(memoryStoreFilePath, 'utf8');
    const parsedContent = JSON.parse(rawContent || '{}');
    return {
      certificates: Array.isArray(parsedContent.certificates) ? parsedContent.certificates : []
    };
  } catch {
    return {
      certificates: []
    };
  }
}

function persistMemoryCertificates() {
  ensureMemoryStoreFile();
  fs.writeFileSync(
    memoryStoreFilePath,
    JSON.stringify({ certificates: memoryCertificates }, null, 2),
    'utf8'
  );
}

function initializeMemoryCertificates() {
  const persistedStore = loadMemoryStore();
  memoryCertificates.length = 0;

  persistedStore.certificates.forEach((certificate) => {
    const normalizedCertificate = { ...certificate };
    const hash = normalizedCertificate.hash || generateCertificateHash({
      certificateId: normalizedCertificate.certificateId,
      name: normalizedCertificate.name,
      course: normalizedCertificate.course,
      issueDate: normalizedCertificate.issueDate
    });

    normalizedCertificate.hash = hash;
    normalizedCertificate.digitalSignature = normalizedCertificate.digitalSignature || signCertificatePayload({
      certificateId: normalizedCertificate.certificateId,
      name: normalizedCertificate.name,
      course: normalizedCertificate.course,
      issueDate: normalizedCertificate.issueDate,
      hash
    });
    normalizedCertificate.publicKey = normalizedCertificate.publicKey || getPublicKeyPem();

    memoryCertificates.push(normalizedCertificate);
  });

  persistMemoryCertificates();
}

initializeMemoryCertificates();

function setStoreMode(mode) {
  storeMode = mode;
}

function isMemoryMode() {
  return storeMode === 'memory';
}

function toPlainCertificate(certificate) {
  if (!certificate) {
    return null;
  }

  return JSON.parse(JSON.stringify(certificate));
}

function createMemoryCertificate(certificateData) {
  const existingCertificate = memoryCertificates.find((certificate) => certificate.certificateId === certificateData.certificateId);
  if (existingCertificate) {
    const duplicateError = new Error('Certificate ID already exists');
    duplicateError.code = 11000;
    throw duplicateError;
  }

  const now = new Date().toISOString();
  const certificate = {
    _id: crypto.randomUUID(),
    ...certificateData,
    verificationCount: certificateData.verificationCount ?? 0,
    validVerifications: certificateData.validVerifications ?? 0,
    tamperAttempts: certificateData.tamperAttempts ?? 0,
    lastVerificationAt: certificateData.lastVerificationAt ?? null,
    lastVerificationResult: certificateData.lastVerificationResult ?? null,
    createdAt: certificateData.createdAt || now,
    updatedAt: certificateData.updatedAt || now
  };

  memoryCertificates.push(certificate);
  persistMemoryCertificates();
  return toPlainCertificate(certificate);
}

async function createCertificate(certificateData) {
  if (isMemoryMode()) {
    return createMemoryCertificate(certificateData);
  }

  const createdCertificate = await Certificate.create(certificateData);
  return createdCertificate.toObject();
}

async function findCertificateById(certificateId) {
  if (isMemoryMode()) {
    return toPlainCertificate(memoryCertificates.find((certificate) => certificate.certificateId === certificateId)) || null;
  }

  const certificate = await Certificate.findOne({ certificateId }).lean();
  return certificate || null;
}

async function findCertificateByHash(hash) {
  if (isMemoryMode()) {
    return toPlainCertificate(memoryCertificates.find((certificate) => certificate.hash === hash)) || null;
  }

  const certificate = await Certificate.findOne({ hash }).lean();
  return certificate || null;
}

async function listCertificates(limit = 5) {
  if (isMemoryMode()) {
    return memoryCertificates
      .slice()
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
      .slice(0, limit)
      .map((certificate) => toPlainCertificate(certificate));
  }

  return Certificate.find().sort({ createdAt: -1 }).limit(limit).lean();
}

async function countCertificates() {
  if (isMemoryMode()) {
    return memoryCertificates.length;
  }

  return Certificate.countDocuments();
}

async function getVerificationTotals() {
  if (isMemoryMode()) {
    return memoryCertificates.reduce(
      (totals, certificate) => {
        totals.totalVerifications += certificate.verificationCount || 0;
        totals.validVerifications += certificate.validVerifications || 0;
        totals.tamperAttempts += certificate.tamperAttempts || 0;
        return totals;
      },
      { totalVerifications: 0, validVerifications: 0, tamperAttempts: 0 }
    );
  }

  const aggregateResult = await Certificate.aggregate([
    {
      $group: {
        _id: null,
        totalVerifications: { $sum: '$verificationCount' },
        validVerifications: { $sum: '$validVerifications' },
        tamperAttempts: { $sum: '$tamperAttempts' }
      }
    }
  ]);

  return aggregateResult[0] || {
    totalVerifications: 0,
    validVerifications: 0,
    tamperAttempts: 0
  };
}

async function incrementVerificationStats(certificateId, isValid) {
  const now = new Date().toISOString();

  if (isMemoryMode()) {
    const certificate = memoryCertificates.find((entry) => entry.certificateId === certificateId);
    if (!certificate) {
      return null;
    }

    certificate.verificationCount = (certificate.verificationCount || 0) + 1;
    certificate.lastVerificationAt = now;
    certificate.lastVerificationResult = isValid ? 'VALID' : 'INVALID';
    if (isValid) {
      certificate.validVerifications = (certificate.validVerifications || 0) + 1;
    } else {
      certificate.tamperAttempts = (certificate.tamperAttempts || 0) + 1;
    }
    certificate.updatedAt = now;
    persistMemoryCertificates();
    return toPlainCertificate(certificate);
  }

  const update = {
    $inc: {
      verificationCount: 1,
      ...(isValid ? { validVerifications: 1 } : { tamperAttempts: 1 })
    },
    $set: {
      lastVerificationAt: now,
      lastVerificationResult: isValid ? 'VALID' : 'INVALID',
      updatedAt: now
    }
  };

  const updatedCertificate = await Certificate.findOneAndUpdate({ certificateId }, update, { new: true }).lean();
  return updatedCertificate || null;
}

async function getAllCertificates() {
  if (isMemoryMode()) {
    return memoryCertificates.map((certificate) => toPlainCertificate(certificate));
  }

  return Certificate.find().sort({ createdAt: 1 }).lean();
}

module.exports = {
  countCertificates,
  createCertificate,
  findCertificateByHash,
  findCertificateById,
  getAllCertificates,
  getVerificationTotals,
  incrementVerificationStats,
  listCertificates,
  setStoreMode,
  isMemoryMode
};