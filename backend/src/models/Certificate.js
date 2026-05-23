const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
  {
    certificateId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    course: {
      type: String,
      required: true,
      trim: true
    },
    issueDate: {
      type: String,
      required: true
    },
    issuer: {
      type: String,
      default: 'CrediChain Institute'
    },
    issuerPublicKey: {
      type: String,
      required: true
    },
    hash: {
      type: String,
      required: true
    },
    digitalSignature: {
      type: String,
      required: true
    },
    publicKey: {
      type: String,
      default: null
    },
    qrCode: {
      type: String,
      required: true
    },
    qrCodeDataUrl: {
      type: String,
      default: null
    },
    blockchainRecordId: {
      type: String,
      required: true
    },
    blockchainTransactionHash: {
      type: String,
      required: true
    },
    blockchainTimestamp: {
      type: String,
      required: true
    },
    qrCodeDataUrl: {
      type: String,
      required: true
    },
    verificationCount: {
      type: Number,
      default: 0
    },
    validVerifications: {
      type: Number,
      default: 0
    },
    tamperAttempts: {
      type: Number,
      default: 0
    },
    lastVerificationAt: {
      type: String,
      default: null
    },
    lastVerificationResult: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true,
    collection: 'certificates'
  }
);

module.exports = mongoose.model('Certificate', certificateSchema);