import { Log as LogPrismaType, Alert as AlertPrismaType } from '@prisma/client';
import { prisma } from '../server';
import Web3 from 'web3';
import { getIO } from './ioService';
import { anchorDataOnBlockchain } from './blockchainService';
import { recordAuditEvent, AUDIT_ACTIONS } from './auditService';
import * as fs from 'fs';
import * as path from 'path';

// Define the structure for a rule from the JSON file
interface RuleConfig {
  name: string;
  pattern: string;
  flags?: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  confidence: number;
  source?: string;
  eventType?: string;
}

// Define the structure for an operational anomaly rule
interface AnomalyRule {
  pattern: RegExp;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  confidence: number;
  source?: string;
  eventType?: string;
}

// Load rules from the external JSON file
function loadRules(): AnomalyRule[] {
  try {
    const rulesPath = path.join(__dirname, '..', 'config', 'detection_rules.json');
    const rulesConfig: RuleConfig[] = JSON.parse(fs.readFileSync(rulesPath, 'utf-8'));

    return rulesConfig.map(rule => ({
      ...rule,
      pattern: new RegExp(rule.pattern, rule.flags || undefined),
    }));
  } catch (error) {
    console.error("Failed to load or parse detection rules file. Using empty rule set.", error);
    return []; // Return an empty array on error to prevent crash
  }
}

const rules: AnomalyRule[] = loadRules();
console.log(`Loaded ${rules.length} detection rules.`);

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
