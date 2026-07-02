import { apiClient } from "@/lib/api-client";
import type { PaginatedRuns, ReconciliationReport, ReconciliationRun } from "@/features/reconciliation/types/reconciliation.types";
import type { StartReconciliationValues } from "@/features/reconciliation/validation/reconciliation.schema";

export interface ReconListParams {
  page?: number;
  limit?: number;
  period?: string;
  status?: string;
}

export const reconciliationApi = {
  list: async (params: ReconListParams = {}): Promise<PaginatedRuns> => {
    const { data } = await apiClient.get<PaginatedRuns>("/reconciliation", { params });
    return data;
  },
  getById: async (id: string): Promise<ReconciliationRun> => {
    const { data } = await apiClient.get<ReconciliationRun>(`/reconciliation/${id}`);
    return data;
  },
  getReport: async (id: string): Promise<ReconciliationReport> => {
    const { data } = await apiClient.get<ReconciliationReport>(`/reconciliation/${id}/report`);
    return data;
  },
  start: async (values: StartReconciliationValues): Promise<ReconciliationRun> => {
    const { data } = await apiClient.post<ReconciliationRun>("/reconciliation", values);
    return data;
  },
};
