import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../server';
import { protect, AuthenticatedRequest } from '../middleware/authMiddleware'; // Added import

const router = Router();

// GET /api/alerts - Fetch Alerts Endpoint
// Now protected and company-scoped
router.get('/', protect, async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const companyId = req.user?.companyId;

  if (!companyId) {
    res.status(403).json({ error: 'User company information is missing.' });
    return;
  }

  try {
    const alerts = await prisma.alert.findMany({
      where: {
        companyId: companyId, // Filter by companyId
        // Alternatively, if alerts are always linked to logs that have companyId:
        // log: {
        //   companyId: companyId,
        // }
      },
      include: {
        log: true,
      },
      orderBy: {
        createdAt: 'desc',
      }
    });
    res.status(200).json(alerts);
    return; // Explicitly return void
  } catch (error) {
    next(error);
  }
});

export default router;
