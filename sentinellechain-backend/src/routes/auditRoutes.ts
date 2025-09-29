import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../server';
import { protect, AuthenticatedRequest, authorize } from '../middleware/authMiddleware'; // Using authorize for future

const router = Router();

// GET /api/audit - Fetch Audit Trail Entries
router.get(
  '/',
  protect,
  // authorize(['ADMIN', 'COMPANY_ADMIN']), // Future: Restrict to specific roles
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(403).json({ error: 'User company information is missing.' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    try {
      const auditTrails = await prisma.auditTrail.findMany({
        where: {
          companyId: companyId,
        },
        include: { // Optionally include user email for better display
          user: {
            select: {
              email: true,
            }
          }
        },
        orderBy: {
          timestamp: 'desc',
        },
        skip: skip,
        take: limit,
      });

      const totalRecords = await prisma.auditTrail.count({
        where: {
          companyId: companyId,
        },
      });

      res.status(200).json({
        data: auditTrails,
        pagination: {
          page,
          limit,
          totalRecords,
          totalPages: Math.ceil(totalRecords / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
