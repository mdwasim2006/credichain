const mongoose = require('mongoose');

const statsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'global'
    },
    totalCertificates: {
      type: Number,
      default: 0
    },
    totalVerifications: {
      type: Number,
      default: 0
    },
    validChecks: {
      type: Number,
      default: 0
    },
    tamperedAttempts: {
      type: Number,
      default: 0
    },
    fraudAttempts: {
      type: Number,
      default: 0
    },
    suspiciousAlerts: {
      type: Number,
      default: 0
    },
    auditTrail: {
      type: [
        {
          certificateId: { type: String, default: null },
          name: { type: String, default: 'Unknown' },
          status: { type: String, default: 'UNKNOWN' },
          timestamp: { type: String, default: null },
          actorKey: { type: String, default: null }
        }
      ],
      default: []
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Stats', statsSchema);
