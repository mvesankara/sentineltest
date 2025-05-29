import { Log as LogPrismaType, Alert as AlertPrismaType, PrismaClient } from '@prisma/client';
import { prisma } from '../server'; // Import shared Prisma client instance

// Define the structure for a rule
interface AnomalyRule {
  pattern: RegExp;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  confidence: number;
  source?: string; // Optional: to match against logData.source
  eventType?: string; // Optional: to match against logData.eventType
}

// Define the rules for anomaly detection
// These rules are simple and can be extended
const rules: AnomalyRule[] = [
  {
    pattern: /failed login attempts/i,
    severity: "HIGH",
    confidence: 0.75,
  },
  {
    pattern: /port scan detected/i,
    severity: "CRITICAL",
    confidence: 0.90,
  },
  {
    pattern: /denied/i,
    eventType: "firewall_alert",
    severity: "MEDIUM",
    confidence: 0.60,
  },
  {
    pattern: /SQL injection attempt/i,
    severity: "CRITICAL",
    confidence: 0.95,
  },
  {
    pattern: /malware detected/i,
    severity: "CRITICAL",
    confidence: 0.98,
  },
];

/**
 * Analyzes a log entry for anomalies based on predefined rules and creates an alert if an anomaly is detected.
 * @param logData The log data to analyze.
 * @returns A Promise that resolves to the created Alert object or null if no anomaly is detected.
 */
import { Log as LogPrismaType, Alert as AlertPrismaType } from '@prisma/client'; // Keep existing imports
import Web3 from 'web3'; // Moved to top
import { getIO } from './ioService';
import { anchorDataOnBlockchain } from './blockchainService';
import { prisma } from '../server';

const web3Instance = new Web3(); // Use a specific instance name to avoid conflict if web3 is imported elsewhere for other purposes

// Define the structure for a rule (assuming it's defined above or in a shared types file)
interface AnomalyRule {
  pattern: RegExp;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  confidence: number;
  source?: string;
  eventType?: string;
}

import { recordAuditEvent, AUDIT_ACTIONS } from './auditService'; // Added import

// Define the rules for anomaly detection (assuming it's defined above)
const rules: AnomalyRule[] = [
  { pattern: /failed login attempts/i, severity: "HIGH", confidence: 0.75, },
  { pattern: /port scan detected/i, severity: "CRITICAL", confidence: 0.90, },
  { pattern: /denied/i, eventType: "firewall_alert", severity: "MEDIUM", confidence: 0.60, },
  { pattern: /SQL injection attempt/i, severity: "CRITICAL", confidence: 0.95, },
  { pattern: /malware detected/i, severity: "CRITICAL", confidence: 0.98, },
];


// Updated to accept companyId
export async function analyzeLogAndCreateAlert(logData: LogPrismaType, companyId: string): Promise<AlertPrismaType | null> {
  for (const rule of rules) {
    if (rule.source && rule.source.toLowerCase() !== logData.source.toLowerCase()) {
      continue;
    }
    if (rule.eventType && rule.eventType.toLowerCase() !== logData.eventType.toLowerCase()) {
      continue;
    }

    if (rule.pattern.test(logData.content)) {
      let createdAlert: AlertPrismaType & { log: LogPrismaType } | null = null;
      try {
        createdAlert = await prisma.alert.create({
          data: {
            logId: logData.id,
            severity: rule.severity,
            aiConfidence: rule.confidence,
            status: "NEW",
            companyId: companyId, 
          },
          include: { log: true },
        });
        console.log(`Alert created for log ${logData.id} (Company: ${companyId}) based on rule: ${rule.pattern}, severity: ${rule.severity}`);

        // Record audit event for alert creation
        await recordAuditEvent({
          action: AUDIT_ACTIONS.ALERT_CREATED,
          // userId: null, // Or if logData contains userId, use that. For now, system action under company.
          companyId: companyId,
          details: { 
            alertId: createdAlert.id, 
            severity: createdAlert.severity, 
            logId: createdAlert.logId,
            rulePattern: rule.pattern.toString(), // Log which rule triggered it
          },
        });

        if (createdAlert) {
          const dataToAnchor = JSON.stringify({
            alertId: createdAlert.id,
            logId: createdAlert.logId,
            companyId: createdAlert.companyId, 
            timestamp: createdAlert.createdAt,
            logContentHash: web3Instance.utils.sha3(createdAlert.log.content) 
          });
          
          console.log(`Attempting to anchor data for alert ${createdAlert.id}: ${dataToAnchor.substring(0,100)}...`);
          const txHash = await anchorDataOnBlockchain(dataToAnchor);

          if (txHash) {
            console.log(`Data for alert ${createdAlert.id} anchored. Tx Hash: ${txHash}`);
            createdAlert = await prisma.alert.update({
              where: { id: createdAlert.id },
              data: { blockchainHash: txHash },
              include: { log: true },
            });
          } else {
            console.warn(`Failed to anchor data for alert ${createdAlert.id} on blockchain.`);
          }
        }
        
        if (createdAlert) {
          const io = getIO();
          io.emit('new_alert', createdAlert); 
          console.log('Emitted new_alert event via Socket.IO with alert:', createdAlert.id);
        }
        return createdAlert;
      } catch (error) {
        console.error("Error during alert creation or blockchain anchoring:", error);
        return createdAlert; 
      }
    }
  }
  return null;
}
