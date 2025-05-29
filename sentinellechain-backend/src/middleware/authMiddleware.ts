import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-very-secure-and-long-jwt-secret'; // Ensure this matches authService

// Extend Express Request type to include 'user'
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    companyId: string;
    role: string;
    // Add other properties from the JWT payload if needed
  };
}

export function protect(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided or malformed token.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; companyId: string; role: string; iat: number; exp: number };
    
    // Attach user info to request object
    req.user = {
      userId: decoded.userId,
      companyId: decoded.companyId,
      role: decoded.role,
    };
    
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    if (error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({ error: 'Unauthorized: Token expired.' });
    }
    if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token.' });
    }
    return res.status(401).json({ error: 'Unauthorized: Could not verify token.' });
  }
}

// Optional: Role-based authorization middleware
export function authorize(roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: You do not have the necessary permissions.' });
    }
    next();
  };
}
