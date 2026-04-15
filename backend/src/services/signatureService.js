const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const keysDirectoryPath = path.join(__dirname, '..', '..', 'data', 'keys');
const privateKeyPath = path.join(keysDirectoryPath, 'credichain-private.pem');
const publicKeyPath = path.join(keysDirectoryPath, 'credichain-public.pem');
const keyAlgorithm = 'RSA-SHA256';

function ensureSigningKeyPair() {
  fs.mkdirSync(keysDirectoryPath, { recursive: true });

  if (fs.existsSync(privateKeyPath) && fs.existsSync(publicKeyPath)) {
    return {
      privateKeyPem: fs.readFileSync(privateKeyPath, 'utf8'),
      publicKeyPem: fs.readFileSync(publicKeyPath, 'utf8')
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
    publicKeyPem: publicKey
  };
}

function serializeSignableData(data) {
  return JSON.stringify(data);
}

function signCertificatePayload(signableData) {
  const { privateKeyPem } = ensureSigningKeyPair();
  const signer = crypto.createSign(keyAlgorithm);
  signer.update(serializeSignableData(signableData));
  signer.end();
  return signer.sign(privateKeyPem, 'base64');
}

function verifyCertificatePayloadSignature(signableData, signature) {
  if (!signature) {
    return false;
  }

  const { publicKeyPem } = ensureSigningKeyPair();
  const verifier = crypto.createVerify(keyAlgorithm);
  verifier.update(serializeSignableData(signableData));
  verifier.end();
  return verifier.verify(publicKeyPem, signature, 'base64');
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