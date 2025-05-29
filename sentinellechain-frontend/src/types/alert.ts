export interface LogData {
    id: string;
    timestamp: string; // ISO string
    source: string;
    eventType: string;
    content: string;
    hash: string | null;
    severity: string | null; // Log's own reported severity, if any
    companyId?: string; // Added for completeness, though log might not always have it directly if accessed via alert
  }
  
  export type AlertSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  export type AlertStatus = "NEW" | "ACKNOWLEDGED" | "RESOLVED" | "DISMISSED";
  
  export interface Alert {
    id: string;
    logId: string;
    severity: AlertSeverity;
    aiConfidence: number | null;
    blockchainHash: string | null;
    status: AlertStatus;
    createdAt: string; // ISO string
    log: LogData; // Nested log data
    companyId?: string; // To ensure it belongs to the current company
    // Any other fields that might come from the backend
  }
