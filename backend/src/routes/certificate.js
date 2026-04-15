const express = require('express');
const { createCertificate, downloadCertificatePdfById, generateCertificatePdf, getCertificateById, getCertificates } = require('../controllers/certificateController');

const router = express.Router();

router.post('/create-certificate', createCertificate);
router.post('/generate-certificate-pdf', generateCertificatePdf);
router.get('/download-certificate/:id', downloadCertificatePdfById);
router.get('/certificates', getCertificates);
router.get('/certificate/:id', getCertificateById);

module.exports = router;