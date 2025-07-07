import { Log as LogPrismaType, Alert as AlertPrismaType } from '@prisma/client'; // Keep existing imports
import { prisma } from '../server'; // Import shared Prisma client instance
import Web3 from 'web3';
import { getIO } from './ioService';
import { anchorDataOnBlockchain } from './blockchainService';
import { recordAuditEvent, AUDIT_ACTIONS } from './auditService';

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

const web3Instance = new Web3();

/**
 * Analyzes a log entry for anomalies based on predefined rules and creates an alert if an anomaly is detected.
 * @param logData The log data to analyze.
 * @param companyId The ID of the company this log belongs to.
 * @returns A Promise that resolves to the created Alert object or null if no anomaly is detected.
 */
export async function analyzeLogAndCreateAlert(logData: LogPrismaType, companyId: string): Promise<(AlertPrismaType & { log: LogPrismaType }) | null> {
  for (const rule of rules) {
    if (rule.source && rule.source.toLowerCase() !== logData.source.toLowerCase()) {
      continue;
    }
    if (rule.eventType && rule.eventType.toLowerCase() !== logData.eventType.toLowerCase()) {
      continue;
    }

    if (rule.pattern.test(logData.content)) {
      let createdAlertFull: (AlertPrismaType & { log: LogPrismaType }) | null = null;
      try {
        const createdAlert = await prisma.alert.create({
          data: {
            logId: logData.id,
            severity: rule.severity,
            aiConfidence: rule.confidence,
            status: "NEW",
            companyId: companyId, 
          },
          include: { log: true }, // Ensure log is included for the return type
        });

        createdAlertFull = createdAlert; // Assign to the correctly typed variable

        console.log(`Alert created for log ${logData.id} (Company: ${companyId}) based on rule: ${rule.pattern}, severity: ${rule.severity}`);

        // Record audit event for alert creation
        await recordAuditEvent({
          action: AUDIT_ACTIONS.ALERT_CREATED,
          companyId: companyId,
          details: { 
            alertId: createdAlertFull.id,
            severity: createdAlertFull.severity,
            logId: createdAlertFull.logId,
            rulePattern: rule.pattern.toString(),
          },
        });

        if (createdAlertFull && createdAlertFull.log) { // Ensure log is present for hashing
          const dataToAnchor = JSON.stringify({
            alertId: createdAlertFull.id,
            logId: createdAlertFull.logId,
            companyId: createdAlertFull.companyId,
            timestamp: createdAlertFull.createdAt,
            logContentHash: web3Instance.utils.sha3(createdAlertFull.log.content)
          });
          
          console.log(`Attempting to anchor data for alert ${createdAlertFull.id}: ${dataToAnchor.substring(0,100)}...`);
          const txHash = await anchorDataOnBlockchain(dataToAnchor);

          if (txHash) {
            console.log(`Data for alert ${createdAlertFull.id} anchored. Tx Hash: ${txHash}`);
            // Update the alert with the blockchain hash
            const updatedAlertWithHash = await prisma.alert.update({
              where: { id: createdAlertFull.id },
              data: { blockchainHash: txHash },
              include: { log: true }, // Keep log included
            });
            createdAlertFull = updatedAlertWithHash; // Update our variable
          } else {
            console.warn(`Failed to anchor data for alert ${createdAlertFull.id} on blockchain.`);
          }
        }
        
        if (createdAlertFull) {
          const io = getIO();
          io.emit('new_alert', createdAlertFull);
          console.log('Emitted new_alert event via Socket.IO with alert:', createdAlertFull.id);
        }
        return createdAlertFull;
      } catch (error) {
        console.error("Error during alert creation or blockchain anchoring:", error);
        // If an error occurred after alert creation but during anchoring/emitting,
        // createdAlertFull might still hold the initial alert.
        // Depending on desired behavior, you might want to return it or null.
        return createdAlertFull; // Or null if partial success is not acceptable
      }
    }
  }
  return null;
}
