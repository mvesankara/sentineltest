import { prisma } from '../server'; // Shared Prisma client
import { AuditTrail } from '@prisma/client';

interface AuditEventData {
  action: string;
  userId?: string;
  companyId?: string;
  details?: object; // Prisma's Json type expects an object or null
}

/**
 * Records an audit event in the database.
 * @param data - The data for the audit event.
 */
export async function recordAuditEvent(data: AuditEventData): Promise<void> {
  try {
    await prisma.auditTrail.create({
      data: {
        action: data.action,
        userId: data.userId,
        companyId: data.companyId,
        details: data.details || undefined, // Ensure details is not null if empty, Prisma expects JsonValue
      },
    });
    console.log(`Audit event recorded: Action - ${data.action}, Company - ${data.companyId}, User - ${data.userId || 'System'}`);
  } catch (error) {
    console.error('Failed to record audit event:', error);
    // Depending on the criticality, you might want to re-throw or handle differently.
    // For audit trails, it's often preferred not to break the main operation.
  }
}

// Define common action types (optional, but good practice)
export const AUDIT_ACTIONS = {
  USER_LOGIN: 'USER_LOGIN',
  USER_REGISTER: 'USER_REGISTER', // If you want to audit registration
  LOG_INGESTED: 'LOG_INGESTED',
  ALERT_CREATED: 'ALERT_CREATED',
  ALERT_STATUS_UPDATED: 'ALERT_STATUS_UPDATED', // For future use
  // Add other actions as needed
};
