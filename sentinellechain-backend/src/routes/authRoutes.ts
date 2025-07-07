import { Router, Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { email, password, companyName } = req.body;

  if (!email || !password || !companyName) {
    res.status(400).json({ error: 'Email, password, and company name are required.' });
    return;
  }

  try {
    const user = await authService.register(email, password, companyName);
    res.status(201).json({ message: 'User registered successfully', user });
    return;
  } catch (error: any) {
    if (error.message === 'User with this email already exists.') {
      res.status(409).json({ error: error.message }); // Conflict
      return;
    }
    next(error); // Pass to global error handler
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  try {
    const { token, user } = await authService.login(email, password);
    res.status(200).json({ token, user });
    return;
  } catch (error: any) {
    if (error.message === 'Invalid email or password.') {
      res.status(401).json({ error: error.message }); // Unauthorized
      return;
    }
    next(error);
  }
});

export default router;
