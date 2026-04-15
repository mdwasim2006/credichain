const crypto = require('crypto');

const ledger = [];

function createTransactionHash() {
  return `0x${crypto.randomBytes(16).toString('hex')}`;
}

function appendCertificateRecord({ certificateId, hash, issuer }) {
  const previousRecord = ledger[ledger.length - 1] || null;
  const record = {
    blockNumber: ledger.length + 1,
    certificateId,
    hash,
    issuer,
    previousHash: previousRecord ? previousRecord.hash : 'GENESIS',
    transactionHash: createTransactionHash(),
    timestamp: new Date().toISOString()
  };

  ledger.push(record);
  return record;
}

function seedLedger(records = []) {
  ledger.length = 0;

  records.forEach((record, index) => {
    const previousRecord = index > 0 ? records[index - 1] : null;
    ledger.push({
      blockNumber: index + 1,
      certificateId: record.certificateId,
      hash: record.hash,
      issuer: record.issuer || 'CrediChain Institute',
      previousHash: record.previousHash || (previousRecord ? previousRecord.hash : 'GENESIS'),
      transactionHash: record.blockchainTransactionHash || createTransactionHash(),
      timestamp: record.blockchainTimestamp || record.createdAt || new Date().toISOString()
    });
  });

  return getLedgerSnapshot();
}

function getCertificateRecord(certificateId) {
  return ledger.find((record) => record.certificateId === certificateId) || null;
}

function getLedgerSnapshot() {
  return [...ledger];
}

module.exports = {
  appendCertificateRecord,
  getCertificateRecord,
  getLedgerSnapshot,
  seedLedger
};