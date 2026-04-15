const cors = require('cors');
const dotenv = require('dotenv');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');

const certificateRoutes = require('./routes/certificate');
const dashboardRoutes = require('./routes/dashboard');
const verifyRoutes = require('./routes/verify');
const { seedDemoCertificates } = require('./controllers/demoController');

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173'
}));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'CrediChain API is running'
  });
});

app.post('/seed-demo-data', seedDemoCertificates);

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