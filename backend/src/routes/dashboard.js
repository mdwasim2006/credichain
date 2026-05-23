const express = require('express');
const { getBlockchainRecords, getDashboardStats } = require('../controllers/certificateController');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

router.get('/dashboard/stats', requireAuth, getDashboardStats);
router.get('/stats', requireAuth, getDashboardStats);
router.get('/blockchain/records', requireAuth, getBlockchainRecords);

module.exports = router;