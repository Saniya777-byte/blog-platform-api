const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Connection timeout settings
      serverSelectionTimeoutMS: 10000,   
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,

      // Connection pool
      maxPoolSize: 10,
      minPoolSize: 1,

      // Retries
      retryWrites: true,
      retryReads: true
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Handle post-connect errors gracefully
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected — attempting to reconnect…');
    });

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;