"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customerApi, type CustomerListParams } from "@/features/customers/services/customer.service";
import type { CustomerFormValues } from "@/features/customers/validation/customer.schema";

export const customerKeys = {
  all: ["customers"] as const,
  list: (params: CustomerListParams) => ["customers", "list", params] as const,
  detail: (id: string) => ["customers", id] as const,
  history: (id: string) => ["customers", id, "history"] as const,
  analytics: () => ["customers", "analytics"] as const,
};

export function useCustomers(params: CustomerListParams = {}) {
  return useQuery({
    queryKey: customerKeys.list(params),
    queryFn: () => customerApi.list(params),
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: () => customerApi.getById(id),
    enabled: !!id,
  });
}

export function useCustomerHistory(id: string) {
  return useQuery({
    queryKey: customerKeys.history(id),
    queryFn: () => customerApi.getHistory(id),
    enabled: !!id,
  });
}

export function useCustomerAnalytics() {
  return useQuery({
    queryKey: customerKeys.analytics(),
    queryFn: customerApi.getAnalytics,
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: CustomerFormValues) => customerApi.create(values),
    onSuccess: () => qc.invalidateQueries({ queryKey: customerKeys.all }),
  });
}

export function useUpdateCustomer(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: Partial<CustomerFormValues>) => customerApi.update(id, values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: customerKeys.detail(id) });
      qc.invalidateQueries({ queryKey: customerKeys.all });
    },
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => customerApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: customerKeys.all }),
  });
}
