const fs = require('fs');
const mongoose = require('mongoose');
const path = require('path');
const FraudLog = require('../models/FraudLog');
const Stats = require('../models/Stats');

const GLOBAL_KEY = 'global';
const SUSPICIOUS_WINDOW_MS = 10 * 60 * 1000;
const SUSPICIOUS_THRESHOLD = 3;

const memoryStats = {
  totalCertificates: 0,
  totalVerifications: 0,
  validChecks: 0,
  tamperedAttempts: 0,
  fraudAttempts: 0,
  suspiciousAlerts: 0,
  auditTrail: []
};
const memoryFraudLogs = [];

const statsFilePath = path.join(__dirname, '..', '..', 'data', 'verification-stats.json');
const fraudFilePath = path.join(__dirname, '..', '..', 'data', 'fraud-logs.json');

function isMongoReady() {
  return mongoose.connection.readyState === 1;
}

function ensureDataFile(filePath, fallbackPayload) {
  const directoryPath = path.dirname(filePath);
  fs.mkdirSync(directoryPath, { recursive: true });

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(fallbackPayload, null, 2), 'utf8');
  }
}

function persistMemoryStats() {
  ensureDataFile(statsFilePath, memoryStats);
  fs.writeFileSync(statsFilePath, JSON.stringify(memoryStats, null, 2), 'utf8');
}

function persistMemoryFraudLogs() {
  ensureDataFile(fraudFilePath, { logs: [] });
  fs.writeFileSync(fraudFilePath, JSON.stringify({ logs: memoryFraudLogs }, null, 2), 'utf8');
}

function loadMemoryState() {
  try {
    ensureDataFile(statsFilePath, memoryStats);
    const parsedStats = JSON.parse(fs.readFileSync(statsFilePath, 'utf8') || '{}');
    memoryStats.totalCertificates = Number(parsedStats.totalCertificates || 0);
    memoryStats.totalVerifications = Number(parsedStats.totalVerifications || 0);
    memoryStats.validChecks = Number(parsedStats.validChecks || 0);
    memoryStats.tamperedAttempts = Number(parsedStats.tamperedAttempts || 0);
    memoryStats.fraudAttempts = Number(parsedStats.fraudAttempts || parsedStats.notFoundChecks || 0);
    memoryStats.suspiciousAlerts = Number(parsedStats.suspiciousAlerts || 0);
    memoryStats.auditTrail = Array.isArray(parsedStats.auditTrail) ? parsedStats.auditTrail : [];
  } catch {
    memoryStats.totalCertificates = 0;
    memoryStats.totalVerifications = 0;
    memoryStats.validChecks = 0;
    memoryStats.tamperedAttempts = 0;
    memoryStats.fraudAttempts = 0;
    memoryStats.suspiciousAlerts = 0;
    memoryStats.auditTrail = [];
  }

  try {
    ensureDataFile(fraudFilePath, { logs: [] });
    const parsedLogs = JSON.parse(fs.readFileSync(fraudFilePath, 'utf8') || '{}');
    memoryFraudLogs.length = 0;
    (Array.isArray(parsedLogs.logs) ? parsedLogs.logs : []).forEach((log) => {
      memoryFraudLogs.push(log);
    });
  } catch {
    memoryFraudLogs.length = 0;
  }
}

loadMemoryState();

function mapStatusLabel(status) {
  if (status === 'valid') {
    return 'VALID';
  }

  if (status === 'tampered') {
    return 'TAMPERED';
  }

  return 'NOT FOUND';
}

function resolveActorKey(metadata = {}) {
  return metadata.sessionId || metadata.userIp || 'unknown';
}

function resolveRiskLevel(failedAttempts, tamperedAttemptsByActor) {
  if (tamperedAttemptsByActor >= 2) {
    return 'high';
  }

  if (failedAttempts >= SUSPICIOUS_THRESHOLD) {
    return 'medium';
  }

  return 'low';
}

async function initializeVerificationStats(stats = {}) {
  if (isMongoReady()) {
    await Stats.findOneAndUpdate(
      { key: GLOBAL_KEY },
      {
        $setOnInsert: {
          key: GLOBAL_KEY,
          totalCertificates: Number(stats.totalCertificates || 0),
          totalVerifications: Number(stats.totalVerifications || 0),
          validChecks: Number(stats.validChecks || stats.validVerifications || 0),
          tamperedAttempts: Number(stats.tamperedAttempts || 0),
          fraudAttempts: Number(stats.fraudAttempts || stats.notFoundChecks || 0),
          suspiciousAlerts: Number(stats.suspiciousAlerts || 0),
          auditTrail: Array.isArray(stats.auditTrail) ? stats.auditTrail : []
        }
      },
      { upsert: true, new: true }
    ).lean();

    return;
  }

  if (memoryStats.totalCertificates === 0) {
    memoryStats.totalCertificates = Number(stats.totalCertificates || 0);
  }
  if (memoryStats.totalVerifications === 0) {
    memoryStats.totalVerifications = Number(stats.totalVerifications || 0);
  }
  if (memoryStats.validChecks === 0) {
    memoryStats.validChecks = Number(stats.validChecks || stats.validVerifications || 0);
  }
  if (memoryStats.tamperedAttempts === 0) {
    memoryStats.tamperedAttempts = Number(stats.tamperedAttempts || 0);
  }
  if (memoryStats.fraudAttempts === 0) {
    memoryStats.fraudAttempts = Number(stats.fraudAttempts || stats.notFoundChecks || 0);
  }

  persistMemoryStats();
}

async function incrementTotalCertificates(amount = 1) {
  const incrementBy = Math.max(0, Number(amount || 0));
  if (!incrementBy) {
    return getVerificationStatsSnapshot();
  }

  if (isMongoReady()) {
    const updated = await Stats.findOneAndUpdate(
      { key: GLOBAL_KEY },
      {
        $setOnInsert: { key: GLOBAL_KEY },
        $inc: { totalCertificates: incrementBy }
      },
      { upsert: true, new: true }
    ).lean();

    return updated;
  }

  memoryStats.totalCertificates += incrementBy;
  persistMemoryStats();
  return getVerificationStatsSnapshot();
}

async function recordFraudLog(attemptType, metadata = {}, failedAttempts = 0, tamperedAttemptsByActor = 0) {
  const actorKey = resolveActorKey(metadata);
  const riskLevel = resolveRiskLevel(failedAttempts, tamperedAttemptsByActor);
  const suspicious = failedAttempts >= SUSPICIOUS_THRESHOLD;

  if (isMongoReady()) {
    await FraudLog.create({
      certId: metadata.certificateId || null,
      attemptType,
      timestamp: metadata.timestamp ? new Date(metadata.timestamp) : new Date(),
      userIp: metadata.userIp || 'unknown',
      sessionId: metadata.sessionId || null,
      actorKey,
      riskLevel,
      suspicious
    });

    return { riskLevel, suspicious };
  }

  memoryFraudLogs.unshift({
    certId: metadata.certificateId || null,
    attemptType,
    timestamp: metadata.timestamp || new Date().toISOString(),
    userIp: metadata.userIp || 'unknown',
    sessionId: metadata.sessionId || null,
    actorKey,
    riskLevel,
    suspicious
  });
  memoryFraudLogs.splice(500);
  persistMemoryFraudLogs();

  return { riskLevel, suspicious };
}

async function getActorFraudCounts(metadata = {}) {
  const actorKey = resolveActorKey(metadata);
  const thresholdTime = new Date(Date.now() - SUSPICIOUS_WINDOW_MS);

  if (isMongoReady()) {
    const [failedAttempts, tamperedAttempts] = await Promise.all([
      FraudLog.countDocuments({ actorKey, timestamp: { $gte: thresholdTime } }),
      FraudLog.countDocuments({ actorKey, attemptType: 'tampered', timestamp: { $gte: thresholdTime } })
    ]);

    return {
      actorKey,
      failedAttempts,
      tamperedAttemptsByActor: tamperedAttempts
    };
  }

  const recentLogs = memoryFraudLogs.filter((entry) => entry.actorKey === actorKey && new Date(entry.timestamp).getTime() >= thresholdTime.getTime());
  return {
    actorKey,
    failedAttempts: recentLogs.length,
    tamperedAttemptsByActor: recentLogs.filter((entry) => entry.attemptType === 'tampered').length
  };
}

async function recordVerification(status, metadata = {}) {
  const nowIso = metadata.timestamp || new Date().toISOString();
  const actorKey = resolveActorKey(metadata);
  const isValid = status === 'valid';
  const isTampered = status === 'tampered';
  const isNotFound = status === 'not_found';

  let suspicious = false;
  let riskLevel = 'low';
  let failedAttempts = 0;

  if (isMongoReady()) {
    const update = {
      $setOnInsert: { key: GLOBAL_KEY },
      $inc: {
        totalVerifications: 1,
        ...(isValid ? { validChecks: 1 } : {}),
        ...(isTampered ? { tamperedAttempts: 1 } : {}),
        ...(isNotFound ? { fraudAttempts: 1 } : {})
      },
      $push: {
        auditTrail: {
          $each: [
            {
              certificateId: metadata.certificateId || null,
              name: metadata.name || 'Unknown',
              status: mapStatusLabel(status),
              timestamp: nowIso,
              actorKey
            }
          ],
          $position: 0,
          $slice: 200
        }
      }
    };

    await Stats.findOneAndUpdate({ key: GLOBAL_KEY }, update, { upsert: true, new: true }).lean();

    if (isTampered || isNotFound) {
      const actorCountsBefore = await getActorFraudCounts(metadata);
      failedAttempts = actorCountsBefore.failedAttempts + 1;
      const tamperedAttemptsByActor = actorCountsBefore.tamperedAttemptsByActor + (isTampered ? 1 : 0);
      const fraudInfo = await recordFraudLog(isTampered ? 'tampered' : 'not_found', { ...metadata, timestamp: nowIso }, failedAttempts, tamperedAttemptsByActor);
      suspicious = fraudInfo.suspicious;
      riskLevel = fraudInfo.riskLevel;

      if (failedAttempts === SUSPICIOUS_THRESHOLD) {
        await Stats.findOneAndUpdate({ key: GLOBAL_KEY }, { $inc: { suspiciousAlerts: 1 } }, { upsert: true });
      }
    }

    const statsSnapshot = await getVerificationStatsSnapshot();
    return {
      stats: statsSnapshot,
      fraudStatus: {
        suspicious,
        attempts: failedAttempts,
        riskLevel
      }
    };
  }

  memoryStats.totalVerifications += 1;
  if (isValid) {
    memoryStats.validChecks += 1;
  }
  if (isTampered) {
    memoryStats.tamperedAttempts += 1;
  }
  if (isNotFound) {
    memoryStats.fraudAttempts += 1;
  }

  memoryStats.auditTrail.unshift({
    certificateId: metadata.certificateId || null,
    name: metadata.name || 'Unknown',
    status: mapStatusLabel(status),
    timestamp: nowIso,
    actorKey
  });
  memoryStats.auditTrail = memoryStats.auditTrail.slice(0, 200);

  if (isTampered || isNotFound) {
    const actorCountsBefore = await getActorFraudCounts(metadata);
    failedAttempts = actorCountsBefore.failedAttempts + 1;
    const tamperedAttemptsByActor = actorCountsBefore.tamperedAttemptsByActor + (isTampered ? 1 : 0);
    const fraudInfo = await recordFraudLog(isTampered ? 'tampered' : 'not_found', { ...metadata, timestamp: nowIso }, failedAttempts, tamperedAttemptsByActor);
    suspicious = fraudInfo.suspicious;
    riskLevel = fraudInfo.riskLevel;

    if (failedAttempts === SUSPICIOUS_THRESHOLD) {
      memoryStats.suspiciousAlerts += 1;
    }
  }

  persistMemoryStats();

  return {
    stats: getVerificationStatsSnapshot(),
    fraudStatus: {
      suspicious,
      attempts: failedAttempts,
      riskLevel
    }
  };
}

async function getFraudStatus(metadata = {}) {
  const actorCounts = await getActorFraudCounts(metadata);
  return {
    suspicious: actorCounts.failedAttempts >= SUSPICIOUS_THRESHOLD,
    attempts: actorCounts.failedAttempts,
    riskLevel: resolveRiskLevel(actorCounts.failedAttempts, actorCounts.tamperedAttemptsByActor)
  };
}

async function getVerificationStatsSnapshot() {
  if (isMongoReady()) {
    const stats = await Stats.findOne({ key: GLOBAL_KEY }).lean();
    if (!stats) {
      return {
        totalCertificates: 0,
        totalVerifications: 0,
        validChecks: 0,
        tamperedAttempts: 0,
        fraudAttempts: 0,
        suspiciousAlerts: 0,
        auditTrail: []
      };
    }

    return {
      totalCertificates: Number(stats.totalCertificates || 0),
      totalVerifications: Number(stats.totalVerifications || 0),
      validChecks: Number(stats.validChecks || 0),
      tamperedAttempts: Number(stats.tamperedAttempts || 0),
      fraudAttempts: Number(stats.fraudAttempts || 0),
      suspiciousAlerts: Number(stats.suspiciousAlerts || 0),
      auditTrail: Array.isArray(stats.auditTrail) ? stats.auditTrail : []
    };
  }

  return {
    totalCertificates: Number(memoryStats.totalCertificates || 0),
    totalVerifications: Number(memoryStats.totalVerifications || 0),
    validChecks: Number(memoryStats.validChecks || 0),
    tamperedAttempts: Number(memoryStats.tamperedAttempts || 0),
    fraudAttempts: Number(memoryStats.fraudAttempts || 0),
    suspiciousAlerts: Number(memoryStats.suspiciousAlerts || 0),
    auditTrail: Array.isArray(memoryStats.auditTrail) ? memoryStats.auditTrail : []
  };
}

module.exports = {
  getFraudStatus,
  getVerificationStatsSnapshot,
  incrementTotalCertificates,
  initializeVerificationStats,
  recordVerification
};
