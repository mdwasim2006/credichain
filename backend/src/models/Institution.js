const mongoose = require('mongoose');

const institutionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: null
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    collection: 'institutions'
  }
);

module.exports = mongoose.model('Institution', institutionSchema);