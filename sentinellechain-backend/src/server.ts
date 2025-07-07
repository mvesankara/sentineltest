import express, { Application, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import logRoutes from './routes/logRoutes';
import alertRoutes from './routes/alertRoutes';
import authRoutes from './routes/authRoutes';
import auditRoutes from './routes/auditRoutes';
import reportRoutes from './routes/reportRoutes'; // Added import

const app: Application = express();
const prisma = new PrismaClient();

// Middleware
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/reports', reportRoutes); // Added report routes

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'UP' });
});

// Interface for custom errors with a status property
interface HttpError extends Error {
  status?: number;
}

// Global error handler for Prisma
// IMPORTANT: Error handling middleware must be defined AFTER all other app.use() and routes calls
app.use((err: any, req: any, res: any, next: any) => {
  if (err && err.name === 'PrismaClientKnownRequestError') {
    return res.status(400).json({ error: 'Database error: ' + err.message });
  } else if (err && err.name === 'PrismaClientValidationError') {
    return res.status(400).json({ error: 'Invalid data: ' + err.message });
  }
  next(err);
});

// Basic Error Handling
// IMPORTANT: Error handling middleware must be defined AFTER all other app.use() and routes calls
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err.stack);
  const status = err && err.status ? err.status : 500;
  const message = err.message || 'Something went wrong!';
  res.status(status).json({ error: message });
});

export { app, prisma };
