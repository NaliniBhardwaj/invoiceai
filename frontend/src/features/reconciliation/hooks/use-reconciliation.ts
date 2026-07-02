"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { reconciliationApi, type ReconListParams } from "@/features/reconciliation/services/reconciliation.service";
import type { StartReconciliationValues } from "@/features/reconciliation/validation/reconciliation.schema";

export const reconKeys = {
  all: ["reconciliation"] as const,
  list: (p: ReconListParams) => ["reconciliation", "list", p] as const,
  detail: (id: string) => ["reconciliation", id] as const,
  report: (id: string) => ["reconciliation", id, "report"] as const,
};

export function useReconciliationRuns(params: ReconListParams = {}) {
  return useQuery({
    queryKey: reconKeys.list(params),
    queryFn: () => reconciliationApi.list(params),
  });
}

export function useReconciliationRun(id: string) {
  return useQuery({
    queryKey: reconKeys.detail(id),
    queryFn: () => reconciliationApi.getById(id),
    enabled: !!id,
    // Poll every 3 seconds while the run is still PROCESSING
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "PROCESSING" ? 3000 : false;
    },
  });
}

export function useReconciliationReport(id: string, enabled: boolean) {
  return useQuery({
    queryKey: reconKeys.report(id),
    queryFn: () => reconciliationApi.getReport(id),
    enabled: enabled && !!id,
  });
}

export function useStartReconciliation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: StartReconciliationValues) => reconciliationApi.start(values),
    onSuccess: () => qc.invalidateQueries({ queryKey: reconKeys.all }),
  });
}
