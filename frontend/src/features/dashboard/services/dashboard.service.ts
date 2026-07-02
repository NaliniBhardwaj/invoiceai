import { apiClient } from "@/lib/api-client";
import type { DashboardSummary } from "@/features/dashboard/types/dashboard.types";

export const dashboardApi = {
  getSummary: async (): Promise<DashboardSummary> => {
    const { data } = await apiClient.get<DashboardSummary>("/dashboard/summary");
    return data;
  },
};
