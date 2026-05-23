const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
      default: null
    },
    name: {
      type: String,
      trim: true,
      default: ''
    },
    role: {
      type: String,
      default: 'user'
    },
    passwordHash: {
      type: String,
      default: null
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    collection: 'users'
  }
);

module.exports = mongoose.model('User', userSchema);