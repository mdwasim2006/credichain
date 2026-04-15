const QRCode = require('qrcode');

async function generateQrCodeDataUrl(verificationUrl) {
  return QRCode.toDataURL(verificationUrl, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 320,
    color: {
      dark: '#0f172a',
      light: '#ffffff'
    }
  });
}

module.exports = {
  generateQrCodeDataUrl
};