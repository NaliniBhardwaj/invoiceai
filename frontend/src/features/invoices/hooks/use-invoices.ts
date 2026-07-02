"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invoiceApi, type InvoiceListParams } from "@/features/invoices/services/invoice.service";
import type { InvoiceFormValues } from "@/features/invoices/validation/invoice.schema";

export const invoiceKeys = {
  all: ["invoices"] as const,
  list: (params: InvoiceListParams) => ["invoices", "list", params] as const,
  detail: (id: string) => ["invoices", id] as const,
  analytics: () => ["invoices", "analytics"] as const,
};

export function useInvoices(params: InvoiceListParams = {}) {
  return useQuery({ queryKey: invoiceKeys.list(params), queryFn: () => invoiceApi.list(params) });
}

export function useInvoice(id: string) {
  return useQuery({ queryKey: invoiceKeys.detail(id), queryFn: () => invoiceApi.getById(id), enabled: !!id });
}

export function useInvoiceAnalytics() {
  return useQuery({ queryKey: invoiceKeys.analytics(), queryFn: invoiceApi.getAnalytics });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: InvoiceFormValues) => invoiceApi.create(values),
    onSuccess: () => qc.invalidateQueries({ queryKey: invoiceKeys.all }),
  });
}

export function useIssueInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoiceApi.issue(id),
    onSuccess: (_, id) => qc.invalidateQueries({ queryKey: invoiceKeys.detail(id) }),
  });
}

export function useCancelInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoiceApi.cancel(id),
    onSuccess: (_, id) => qc.invalidateQueries({ queryKey: invoiceKeys.detail(id) }),
  });
}

export function useDeleteInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoiceApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: invoiceKeys.all }),
  });
}
