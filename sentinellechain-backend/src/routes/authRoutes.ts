import { Router, Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  const { email, password, companyName } = req.body;

  if (!email || !password || !companyName) {
    return res.status(400).json({ error: 'Email, password, and company name are required.' });
  }

  try {
    const user = await authService.register(email, password, companyName);
    res.status(201).json({ message: 'User registered successfully', user });
  } catch (error: any) {
    if (error.message === 'User with this email already exists.') {
      return res.status(409).json({ error: error.message }); // Conflict
    }
    next(error); // Pass to global error handler
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const { token, user } = await authService.login(email, password);
    res.status(200).json({ token, user });
  } catch (error: any) {
    if (error.message === 'Invalid email or password.') {
      return res.status(401).json({ error: error.message }); // Unauthorized
    }
    next(error);
  }
});

export default router;
