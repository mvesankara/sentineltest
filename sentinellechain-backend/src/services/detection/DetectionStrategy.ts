import { Log, Alert } from '@prisma/client';

/**
 * Représente le résultat d'une analyse de détection.
 * Contient les informations nécessaires pour créer une alerte,
 * mais sans l'alerte elle-même.
 */
export interface DetectionResult {
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  confidence: number;
  ruleName?: string; // Nom de la règle ou du modèle qui a détecté l'anomalie
}

/**
 * Interface pour une stratégie de détection d'anomalie.
 * Chaque stratégie (basée sur des règles, ML, etc.) doit implémenter cette interface.
 */
export interface DetectionStrategy {
  /**
   * Analyse un log pour détecter une éventuelle anomalie.
   * @param log Le log à analyser.
   * @returns Un `DetectionResult` si une anomalie est trouvée, sinon `null`.
   */
  analyze(log: Log): Promise<DetectionResult | null>;
}