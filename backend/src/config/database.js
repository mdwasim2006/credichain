const mongoose = require('mongoose');

async function connectDatabase(mongoUri) {
  if (!mongoUri) {
    throw new Error('MONGODB_URI is required');
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(mongoUri, {
    autoIndex: true
  });

  return mongoose.connection;
}

module.exports = {
  connectDatabase
};