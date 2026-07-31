import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Load Environment Variables first
dotenv.config();

import { errorHandler } from './middleware/errorMiddleware';

// Import Routes
import authRoutes from './routes/authRoutes';
import profileRoutes from './routes/profileRoutes';
import pathRoutes from './routes/pathRoutes';
import quizRoutes from './routes/quizRoutes';
import tutorRoutes from './routes/tutorRoutes';
import uploadRoutes from './routes/uploadRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import reportRoutes from './routes/reportRoutes';
import notificationRoutes from './routes/notificationRoutes';
import communityRoutes from './routes/communityRoutes';
import testRunnerRoutes from './routes/testRunnerRoutes';

const app = express();

// SECURITY FIX: Express sends `X-Powered-By: Express` by default, a small but free
// information-disclosure leak that helps attackers fingerprint the stack. Disable it.
app.disable('x-powered-by');

// Middleware
app.use(cors());
app.use((req, res, next) => {
  console.log(`[HTTP REQUEST] [${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  res.on('finish', () => {
    console.log(`[HTTP RESPONSE] [${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> STATUS ${res.statusCode}`);
  });
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Local Uploads Static Folder & Public Web Dashboard
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(express.static(path.join(__dirname, '../public')));

// Routes mapping
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/path', pathRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/tutor', tutorRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/notification', notificationRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/test-runner', testRunnerRoutes);

// Base route for server health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

// Error Handling Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[PLIS Server] Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
}

export default app;
