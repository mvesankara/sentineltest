import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../server';
import { protect, AuthenticatedRequest } from '../middleware/authMiddleware';
import { Prisma } from '@prisma/client'; // For WhereInput type

const router = Router();

// GET /api/reports/alerts/json - Export Alerts as JSON
router.get(
  '/alerts/json',
  protect,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(403).json({ error: 'User company information is missing.' });
      return;
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
        res.status(400).json({ error: 'Invalid startDate format. Use YYYY-MM-DD.' });
        return;
      }
    }

    if (endDate && typeof endDate === 'string') {
      const date = new Date(endDate);
      if (!isNaN(date.valueOf())) { // Check if date is valid
         // To include the whole end day, set to end of day
        date.setHours(23, 59, 59, 999);
        whereClause.createdAt = { ...whereClause.createdAt as Prisma.DateTimeFilter, lte: date };
      } else {
        res.status(400).json({ error: 'Invalid endDate format. Use YYYY-MM-DD.' });
        return;
      }
    }
    
    // Validate that if both dates are present, startDate is not after endDate
    if (typeof whereClause.createdAt === 'object' &&
        whereClause.createdAt !== null &&
        'gte' in whereClause.createdAt &&
        'lte' in whereClause.createdAt &&
        whereClause.createdAt.gte && // Make sure gte value is truthy (i.e., a Date object)
        whereClause.createdAt.lte) { // Make sure lte value is truthy (i.e., a Date object)

        const gteValue = whereClause.createdAt.gte; // Known to be Date | string from DateTimeFilter
        const lteValue = whereClause.createdAt.lte; // Known to be Date | string from DateTimeFilter

        // Logic ensures these are Date objects due to how they are set earlier
        if (gteValue instanceof Date && lteValue instanceof Date) {
            if (gteValue > lteValue) {
                res.status(400).json({ error: 'startDate cannot be after endDate.' });
                return;
            }
        }
        // It's unlikely gteValue/lteValue are strings here given the construction,
        // but if they could be, additional parsing/validation would be needed:
        // else if (typeof gteValue === 'string' && typeof lteValue === 'string') {
        //   const d1 = new Date(gteValue);
        //   const d2 = new Date(lteValue);
        //   if (!isNaN(d1.valueOf()) && !isNaN(d2.valueOf()) && d1 > d2) {
        //     res.status(400).json({ error: 'startDate cannot be after endDate.' });
        //     return;
        //   }
        // }
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
      return; // Explicitly return void
    } catch (error) {
      console.error("Error generating JSON alert report:", error);
      next(error); // Pass to global error handler, which should also handle void return
    }
  }
);

export default router;
