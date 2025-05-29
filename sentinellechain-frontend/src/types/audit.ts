export interface AuditTrailEntry {
    id: string;
    action: string;
    userId: string | null;
    companyId: string | null;
    details: any | null; // JSON details, can be more specific if structure is known
    timestamp: string; // ISO string
    user?: { // Optional: if user details are populated from backend
      email: string;
    } | null;
  }
  
  export interface AuditTrailApiResponse {
    data: AuditTrailEntry[];
    pagination: {
      page: number;
      limit: number;
      totalRecords: number;
      totalPages: number;
    };
  }
