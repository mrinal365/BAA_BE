import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectMongoDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    await mongoose.connect(mongoUri, {
      maxPoolSize: parseInt(process.env.MONGO_MAX_POOL, 10) || 10,
      minPoolSize: parseInt(process.env.MONGO_MIN_POOL, 10) || 2,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
  }
};

export default mongoose;
