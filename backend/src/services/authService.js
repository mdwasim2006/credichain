const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const DEFAULT_TOKEN_TTL = '12h';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is required');
  }

  return secret;
}

async function hashPassword(password) {
  return bcrypt.hash(String(password), 12);
}

async function comparePassword(password, passwordHash) {
  return bcrypt.compare(String(password), String(passwordHash));
}

function signAdminToken(admin) {
  return jwt.sign(
    {
      sub: String(admin._id || admin.id || admin.username),
      username: admin.username,
      role: admin.role || 'admin'
    },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || DEFAULT_TOKEN_TTL }
  );
}

function verifyAuthToken(token) {
  return jwt.verify(token, getJwtSecret());
}

module.exports = {
  comparePassword,
  hashPassword,
  signAdminToken,
  verifyAuthToken
};