const mongoose = require('mongoose');

const verificationLogSchema = new mongoose.Schema(
  {
    certId: {
      type: String,
      default: null,
      index: true
    },
    attemptType: {
      type: String,
      enum: ['tampered', 'not_found'],
      required: true,
      index: true
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    },
    userIp: {
      type: String,
      default: 'unknown',
      index: true
    },
    sessionId: {
      type: String,
      default: null,
      index: true
    },
    actorKey: {
      type: String,
      default: 'unknown',
      index: true
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low'
    },
    suspicious: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    collection: 'verificationLogs'
  }
);

module.exports = mongoose.model('VerificationLog', verificationLogSchema);