const cors = require('cors');
const dotenv = require('dotenv');
const express = require('express');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const certificateRoutes = require('./routes/certificate');
const dashboardRoutes = require('./routes/dashboard');
const authRoutes = require('./routes/auth');
const verifyRoutes = require('./routes/verify');
const { seedDemoCertificates } = require('./controllers/demoController');

dotenv.config();

const app = express();
const allowedOrigins = (process.env.CORS_ORIGIN || process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push('http://localhost:5173', 'http://127.0.0.1:5173');
}

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: true,
  legacyHeaders: false
});

const verificationLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false
});

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('CORS policy denied this origin'));
  },
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(mongoSanitize());
app.use(morgan('dev'));
app.use(apiLimiter);

app.get('/health', (req, res) => {
  res.json({ status: 'running' });
});

app.get('/verify/:certificateId', (req, res) => {
  const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const targetUrl = `${frontendBaseUrl.replace(/\/$/, '')}/verify?certificateId=${encodeURIComponent(req.params.certificateId)}`;
  return res.redirect(302, targetUrl);
});

app.post('/seed-demo-data', seedDemoCertificates);

app.use('/api', authRoutes);

app.use(['/api/verify-certificate', '/api/upload-verify', '/verify-certificate', '/upload-verify'], verificationLimiter);

app.use('/api', certificateRoutes);
app.use('/api', verifyRoutes);
app.use('/api', dashboardRoutes);

app.use(certificateRoutes);
app.use(verifyRoutes);
app.use(dashboardRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

module.exports = app;