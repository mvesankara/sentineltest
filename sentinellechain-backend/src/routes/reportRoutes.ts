import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../server';
import { protect, AuthenticatedRequest } from '../middleware/authMiddleware';
import { Prisma } from '@prisma/client'; // For WhereInput type

const router = Router();

// GET /api/reports/alerts/json - Export Alerts as JSON
router.get(
  '/alerts/json',
  protect,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const companyId = req.user?.companyId;
    if (!companyId) {
      return res.status(403).json({ error: 'User company information is missing.' });
    }

    const { status, severity, startDate, endDate } = req.query;

    // Build the where clause for Prisma query based on filters
    const whereClause: Prisma.AlertWhereInput = {
      companyId: companyId,
    };

    if (status && typeof status === 'string') {
      const statuses = status.split(',');
      whereClause.status = { in: statuses };
    }

    if (severity && typeof severity === 'string') {
      const severities = severity.split(',');
      whereClause.severity = { in: severities };
    }

    if (startDate && typeof startDate === 'string') {
      const date = new Date(startDate);
      if (!isNaN(date.valueOf())) { // Check if date is valid
        whereClause.createdAt = { ...whereClause.createdAt as Prisma.DateTimeFilter, gte: date };
      } else {
        return res.status(400).json({ error: 'Invalid startDate format. Use YYYY-MM-DD.' });
      }
    }

    if (endDate && typeof endDate === 'string') {
      const date = new Date(endDate);
      if (!isNaN(date.valueOf())) { // Check if date is valid
         // To include the whole end day, set to end of day
        date.setHours(23, 59, 59, 999);
        whereClause.createdAt = { ...whereClause.createdAt as Prisma.DateTimeFilter, lte: date };
      } else {
        return res.status(400).json({ error: 'Invalid endDate format. Use YYYY-MM-DD.' });
      }
    }
    
    // Validate that if both dates are present, startDate is not after endDate
    if (whereClause.createdAt?.gte && whereClause.createdAt?.lte) {
        if (new Date(whereClause.createdAt.gte as string) > new Date(whereClause.createdAt.lte as string)) {
            return res.status(400).json({ error: 'startDate cannot be after endDate.' });
        }
    }


    try {
      const alerts = await prisma.alert.findMany({
        where: whereClause,
        include: {
          log: true, // Include related log information
        },
        orderBy: {
          createdAt: 'desc', // Or any other preferred order
        },
      });

      const filename = `sentinellechain_alerts_export_${new Date().toISOString().split('T')[0]}.json`;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      res.status(200).json(alerts);
    } catch (error) {
      console.error("Error generating JSON alert report:", error);
      next(error);
    }
  }
);

export default router;
