export interface ReconciliationRun {
  id: string;
  period: string;
  sourceType: "GST_CSV" | "GST_JSON";
  status: "PROCESSING" | "COMPLETED" | "FAILED";
  createdAt: string;
  completedAt: string | null;
  findingCount: number;
}

export interface ReconciliationFinding {
  invoiceId: string | null;
  description: string;
  expected: string | null;
  actual: string | null;
}

export interface ReconciliationReport {
  runId: string;
  period: string;
  status: string;
  summary: {
    totalFindings: number;
    byType: Array<{ type: string; count: number; severity: string }>;
    byPeriodInvoices: number;
    byPeriodGstEntries: number;
  };
  gstMismatches: ReconciliationFinding[];
  taxDifferences: ReconciliationFinding[];
  unpaidInvoices: Array<{ invoiceId: string | null; description: string; expectedValue: string | null }>;
}

export interface PaginatedRuns {
  data: ReconciliationRun[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}
