const express = require('express');
const { createCertificate, downloadCertificatePdfById, generateCertificatePdf, getCertificateById, getCertificates } = require('../controllers/certificateController');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

router.post('/create-certificate', requireAuth, createCertificate);
router.post('/generate-certificate-pdf', requireAuth, generateCertificatePdf);
router.get('/download-certificate/:id', requireAuth, downloadCertificatePdfById);
router.get('/certificates', requireAuth, getCertificates);
router.get('/certificate/:id', getCertificateById);

module.exports = router;