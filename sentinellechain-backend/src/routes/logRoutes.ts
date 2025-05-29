import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../server';
import { analyzeLogAndCreateAlert } from '../services/aiDetectionService';
import { protect, AuthenticatedRequest } from '../middleware/authMiddleware'; // Added import

const router = Router();

// POST /api/logs - Log Ingestion Endpoint
// Now protected and company-scoped
router.post('/', protect, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { timestamp, source, eventType, content, hash, severity } = req.body;
  const companyId = req.user?.companyId; // Get companyId from authenticated user

  if (!companyId) {
    return res.status(403).json({ error: 'User company information is missing.' });
  }

  // Basic validation
  if (!timestamp || !source || !eventType || !content) {
    return res.status(400).json({ error: 'Missing required fields: timestamp, source, eventType, content' });
  }

  try {
    const newLog = await prisma.log.create({
      data: {
        timestamp: new Date(timestamp),
        source,
        eventType,
        content,
        hash,
        severity,
        companyId: companyId, // Associate log with company
      },
    });

import { recordAuditEvent, AUDIT_ACTIONS } from '../services/auditService'; // Added import

    if (newLog) {
      // Record audit event for log ingestion
      await recordAuditEvent({
        action: AUDIT_ACTIONS.LOG_INGESTED,
        userId: req.user?.userId, // userId from authenticated user
        companyId: companyId,
        details: { logId: newLog.id, source: newLog.source, eventType: newLog.eventType },
      });

      const alert = await analyzeLogAndCreateAlert(newLog, companyId);
      if (alert) {
        console.log('Alert created:', alert);
        // Alert creation will be audited within analyzeLogAndCreateAlert
      }
    }

    res.status(201).json(newLog);
  } catch (error) {
    next(error);
  }
});

export default router;
