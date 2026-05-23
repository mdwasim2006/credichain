const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const { comparePassword, hashPassword, signAdminToken } = require('../services/authService');

function resolveSeedCredentials() {
  const username = String(process.env.ADMIN_USERNAME || (process.env.NODE_ENV === 'production' ? '' : 'admin')).trim();
  const password = String(process.env.ADMIN_PASSWORD || (process.env.NODE_ENV === 'production' ? '' : '1234')).trim();

  return { username, password };
}

async function ensureDefaultAdmin() {
  const { username, password } = resolveSeedCredentials();

  if (!username || !password) {
    return null;
  }

  const existingAdmin = await Admin.findOne({ username }).lean();
  if (existingAdmin) {
    return existingAdmin;
  }

  const createdAdmin = await Admin.create({
    username,
    passwordHash: await hashPassword(password),
    role: 'admin',
    active: true
  });

  return createdAdmin.toObject();
}

async function loginAdmin(req, res) {
  try {
    const username = String(req.body.username || '').trim();
    const password = String(req.body.password || '').trim();

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'username and password are required'
      });
    }

    if (mongoose.connection.readyState !== 1) {
      const seedCredentials = resolveSeedCredentials();
      if (username === seedCredentials.username && password === seedCredentials.password) {
        const token = signAdminToken({ username, role: 'admin' });
        return res.json({
          success: true,
          token,
          user: {
            username,
            role: 'admin'
          }
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const admin = await Admin.findOne({ username }).lean();

    if (!admin || admin.active === false) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const passwordMatches = await comparePassword(password, admin.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = signAdminToken(admin);

    return res.json({
      success: true,
      token,
      user: {
        username: admin.username,
        role: admin.role || 'admin'
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to authenticate admin',
      error: error.message
    });
  }
}

module.exports = {
  ensureDefaultAdmin,
  loginAdmin
};