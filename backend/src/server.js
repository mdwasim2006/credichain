const dotenv = require('dotenv');
const app = require('./app');
const { connectDatabase } = require('./config/database');
const { seedLedger } = require('./services/blockchainService');
const { seedDemoCertificatesData } = require('./controllers/demoController');
const { ensureDefaultAdmin } = require('./controllers/authController');
const { countCertificates, getAllCertificates, getVerificationTotals, setStoreMode, isMemoryMode } = require('./services/certificateStore');
const { initializeVerificationStats } = require('./services/verificationStatsService');

dotenv.config();

const port = process.env.PORT || 5000;
const isProduction = (process.env.NODE_ENV || 'development') === 'production';
const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

async function startServer() {
  try {
    try {
      await connectDatabase(mongoUri);
      setStoreMode('mongo');
      await ensureDefaultAdmin();
    } catch (connectionError) {
      if (isProduction) {
        throw connectionError;
      }

      setStoreMode('memory');
      console.warn(`MongoDB unavailable, using in-memory demo mode: ${connectionError.message}`);
    }

    if (!isProduction) {
      const certificateCount = await countCertificates();
      if (certificateCount === 0) {
        await seedDemoCertificatesData();
      }
    }

    const certificates = await getAllCertificates();
    seedLedger(certificates);
    const persistedTotals = await getVerificationTotals();
    const totalCertificates = await countCertificates();
    await initializeVerificationStats({
      totalCertificates,
      totalVerifications: persistedTotals.totalVerifications,
      validChecks: persistedTotals.validVerifications,
      tamperAttempts: persistedTotals.tamperAttempts,
      fraudAttempts: 0
    });

    app.listen(port, () => {
      console.log(`CrediChain backend listening on port ${port} (${isMemoryMode() ? 'memory mode' : 'mongo mode'})`);
    });
  } catch (error) {
    console.error('Failed to start backend server:', error.message);
    process.exit(1);
  }
}

startServer();