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

// Basic Error Handling
interface HttpError extends Error {
  status?: number;
}

app.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  const status = err.status || 500;
  const message = err.message || 'Something went wrong!';
  res.status(status).json({ error: message });
});

// Global error handler for Prisma
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err.name === 'PrismaClientKnownRequestError') {
    // Handle Prisma known errors (e.g., unique constraint violations)
    return res.status(400).json({ error: 'Database error: ' + err.message });
  } else if (err.name === 'PrismaClientValidationError') {
    // Handle Prisma validation errors
    return res.status(400).json({ error: 'Invalid data: ' + err.message });
  }
  // For other errors, pass to the default error handler
  next(err);
});


export { app, prisma };
