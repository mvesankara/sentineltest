import { Log } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { DetectionStrategy, DetectionResult } from './DetectionStrategy';

// Structure d'une règle chargée depuis le fichier JSON
interface RuleConfig {
  name: string;
  pattern: string;
  flags?: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  confidence: number;
  source?: string;
  eventType?: string;
}

// Structure d'une règle opérationnelle avec un RegExp compilé
interface AnomalyRule extends RuleConfig {
  pattern: RegExp;
}

/**
 * Stratégie de détection basée sur un ensemble de règles prédéfinies.
 */
export class RuleBasedStrategy implements DetectionStrategy {
  private rules: AnomalyRule[];

  constructor() {
    this.rules = this.loadRules();
    console.log(`[RuleBasedStrategy] ${this.rules.length} règles de détection chargées.`);
  }

  /**
   * Charge les règles de détection depuis le fichier de configuration.
   */
  private loadRules(): AnomalyRule[] {
    try {
      const rulesPath = path.join(__dirname, '..', '..', 'config', 'detection_rules.json');
      const rulesConfig: RuleConfig[] = JSON.parse(fs.readFileSync(rulesPath, 'utf-8'));

      return rulesConfig.map(rule => ({
        ...rule,
        pattern: new RegExp(rule.pattern, rule.flags || 'i'), // 'i' par défaut pour l'insensibilité à la casse
      }));
    } catch (error) {
      console.error("[RuleBasedStrategy] Échec du chargement ou de l'analyse du fichier de règles. Aucune règle ne sera utilisée.", error);
      return [];
    }
  }

  /**
   * Analyse un log en le comparant à l'ensemble des règles chargées.
   * @param log Le log à analyser.
   * @returns Un `DetectionResult` si une règle correspond, sinon `null`.
   */
  public async analyze(log: Log): Promise<DetectionResult | null> {
    for (const rule of this.rules) {
      // Filtrage optionnel par source ou type d'événement
      if (rule.source && rule.source.toLowerCase() !== log.source.toLowerCase()) {
        continue;
      }
      if (rule.eventType && rule.eventType.toLowerCase() !== log.eventType.toLowerCase()) {
        continue;
      }

      // Test du contenu du log avec le pattern de la règle
      if (rule.pattern.test(log.content)) {
        console.log(`[RuleBasedStrategy] Le log ${log.id} a correspondu à la règle "${rule.name}"`);
        return {
          severity: rule.severity,
          confidence: rule.confidence,
          ruleName: rule.name,
        };
      }
    }
    return null; // Aucune règle n'a correspondu
  }
}