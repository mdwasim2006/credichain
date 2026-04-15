const express = require('express');
const { getBlockchainRecords, getDashboardStats } = require('../controllers/certificateController');

const router = express.Router();

router.get('/dashboard/stats', getDashboardStats);
router.get('/stats', getDashboardStats);
router.get('/blockchain/records', getBlockchainRecords);

module.exports = router;