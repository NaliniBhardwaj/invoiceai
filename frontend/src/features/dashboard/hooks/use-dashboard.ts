"use client";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/features/dashboard/services/dashboard.service";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: dashboardApi.getSummary,
    staleTime: 60_000, // 1 minute — dashboard data doesn't need to be real-time
  });
}
