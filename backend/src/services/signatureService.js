const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const keyAlgorithm = 'SHA256';

function resolveKeyPaths() {
  const fallbackDirectory = path.join(__dirname, '..', '..', 'keys');
  const privateKeyPath = process.env.PRIVATE_KEY_PATH || path.join(fallbackDirectory, 'private.pem');
  const publicKeyPath = process.env.PUBLIC_KEY_PATH || path.join(fallbackDirectory, 'public.pem');

  return {
    privateKeyPath,
    publicKeyPath,
    keysDirectoryPath: path.dirname(privateKeyPath)
  };
}

function ensureSigningKeyPair() {
  const { privateKeyPath, publicKeyPath, keysDirectoryPath } = resolveKeyPaths();
  fs.mkdirSync(keysDirectoryPath, { recursive: true });

  if (fs.existsSync(privateKeyPath) && fs.existsSync(publicKeyPath)) {
    return {
      privateKeyPem: fs.readFileSync(privateKeyPath, 'utf8'),
      publicKeyPem: fs.readFileSync(publicKeyPath, 'utf8'),
      privateKeyPath,
      publicKeyPath
    };
  }

  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });

  fs.writeFileSync(privateKeyPath, privateKey, 'utf8');
  fs.writeFileSync(publicKeyPath, publicKey, 'utf8');

  return {
    privateKeyPem: privateKey,
    publicKeyPem: publicKey,
    privateKeyPath,
    publicKeyPath
  };
}

function serializeSignableData(data) {
  return JSON.stringify(data);
}

function signCertificatePayload(signableData) {
  const { privateKeyPem } = ensureSigningKeyPair();
  const signer = crypto.createSign(keyAlgorithm);
  signer.update(serializeSignableData(signableData), 'utf8');
  signer.end();
  return signer.sign(privateKeyPem, 'base64');
}

function verifyCertificatePayloadSignature(signableData, signature, publicKeyPem) {
  if (!signature) {
    return false;
  }

  const verifier = crypto.createVerify(keyAlgorithm);
  verifier.update(serializeSignableData(signableData), 'utf8');
  verifier.end();
  const keyMaterial = publicKeyPem || ensureSigningKeyPair().publicKeyPem;
  return verifier.verify(keyMaterial, signature, 'base64');
}

function getPublicKeyPem() {
  return ensureSigningKeyPair().publicKeyPem;
}

module.exports = {
  ensureSigningKeyPair,
  signCertificatePayload,
  verifyCertificatePayloadSignature,
  getPublicKeyPem
};