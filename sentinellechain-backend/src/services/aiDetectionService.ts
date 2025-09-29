import { Log as LogPrismaType, Alert as AlertPrismaType } from '@prisma/client';
import { prisma } from '../server';
import Web3 from 'web3';
import { getIO } from './ioService';
import { anchorDataOnBlockchain } from './blockchainService';
import { recordAuditEvent, AUDIT_ACTIONS } from './auditService';
import { DetectionStrategy } from './detection/DetectionStrategy';
import { RuleBasedStrategy } from './detection/RuleBasedStrategy';

// Initialise les stratégies de détection.
// À l'avenir, on pourrait charger dynamiquement des stratégies (ML, etc.)
const detectionStrategies: DetectionStrategy[] = [
  new RuleBasedStrategy(),
  // new MachineLearningStrategy(), // Exemple futur
];

const web3Instance = new Web3();

/**
 * Analyse un log en utilisant une liste de stratégies de détection et crée une alerte si une anomalie est trouvée.
 * @param logData Le log à analyser.
 * @param companyId L'ID de l'entreprise propriétaire du log.
 * @returns Une promesse qui se résout avec l'alerte créée (ou null).
 */
export async function analyzeLogAndCreateAlert(logData: LogPrismaType, companyId: string): Promise<(AlertPrismaType & { log: LogPrismaType }) | null> {
  for (const strategy of detectionStrategies) {
    const result = await strategy.analyze(logData);

    if (result) {
      // Une anomalie a été détectée, on crée l'alerte et on arrête l'analyse.
      try {
        const createdAlert = await prisma.alert.create({
          data: {
            logId: logData.id,
            severity: result.severity,
            aiConfidence: result.confidence,
            status: "NEW",
            companyId: companyId,
          },
          include: { log: true },
        });

        console.log(`Alerte ${createdAlert.id} créée pour le log ${logData.id} via la stratégie ${strategy.constructor.name}.`);

        // Enregistrement de l'audit pour la création de l'alerte
        await recordAuditEvent({
          action: AUDIT_ACTIONS.ALERT_CREATED,
          companyId: companyId,
          details: {
            alertId: createdAlert.id,
            severity: createdAlert.severity,
            logId: createdAlert.logId,
            detectionSource: strategy.constructor.name,
            ruleName: result.ruleName, // Ajout du nom de la règle/modèle
          },
        });

        // Ancrage sur la blockchain (si applicable)
        const dataToAnchor = JSON.stringify({
          alertId: createdAlert.id,
          logId: createdAlert.logId,
          companyId: createdAlert.companyId,
          timestamp: createdAlert.createdAt,
          logContentHash: web3Instance.utils.sha3(createdAlert.log.content),
        });
        
        const txHash = await anchorDataOnBlockchain(dataToAnchor);
        let alertWithHash = createdAlert;

        if (txHash) {
          alertWithHash = await prisma.alert.update({
            where: { id: createdAlert.id },
            data: { blockchainHash: txHash },
            include: { log: true },
          });
          console.log(`Données de l'alerte ${createdAlert.id} ancrées. Hash Tx: ${txHash}`);
        } else {
          console.warn(`Échec de l'ancrage des données pour l'alerte ${createdAlert.id}.`);
        }

        // Émission de l'événement en temps réel
        const io = getIO();
        io.emit('new_alert', alertWithHash);
        console.log(`Événement 'new_alert' émis via Socket.IO pour l'alerte ${alertWithHash.id}.`);

        return alertWithHash;
      } catch (error) {
        console.error("Erreur lors de la création de l'alerte ou de l'ancrage blockchain:", error);
        return null; // Retourne null en cas d'échec pour éviter de bloquer le flux
      }
    }
  }

  // Aucune stratégie n'a détecté d'anomalie
  return null;
}
