import mongoose from 'mongoose';
import { seedMockDatabase } from './dbMockFallback';

// Disable mongoose buffering so that offline query interceptions trigger immediately
mongoose.set('bufferCommands', false);

export const connectDB = async (): Promise<void> => {
  try {
    const connUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/plis';
    console.log(`Connecting to MongoDB at: ${connUri}`);
    await mongoose.connect(connUri);
    console.log('MongoDB Connected Successfully.');
  } catch (error) {
    console.warn('[DB Warning] MongoDB is offline. PLIS will fall back to an active in-memory database configuration.');
    await seedMockDatabase();
  }
};
