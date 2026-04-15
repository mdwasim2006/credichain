const express = require('express');
const { getFraudStatusSummary, uploadVerifyCertificate, verifyCertificate } = require('../controllers/verifyController');

const router = express.Router();

router.post('/verify-certificate', verifyCertificate);
router.post('/upload-verify', uploadVerifyCertificate);
router.get('/fraud-status', getFraudStatusSummary);

module.exports = router;