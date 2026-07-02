import { apiClient } from "@/lib/api-client";
import type { Invoice, InvoiceAnalytics, PaginatedInvoices } from "@/features/invoices/types/invoice.types";
import type { InvoiceFormValues } from "@/features/invoices/validation/invoice.schema";

export interface InvoiceListParams {
  page?: number; limit?: number; search?: string;
  status?: string; type?: string; customerId?: string;
  fromDate?: string; toDate?: string; sortOrder?: "asc" | "desc";
}

export const invoiceApi = {
  list: async (params: InvoiceListParams = {}): Promise<PaginatedInvoices> => {
    const { data } = await apiClient.get<PaginatedInvoices>("/invoices", { params });
    return data;
  },
  getById: async (id: string): Promise<Invoice> => {
    const { data } = await apiClient.get<Invoice>(`/invoices/${id}`);
    return data;
  },
  getAnalytics: async (): Promise<InvoiceAnalytics> => {
    const { data } = await apiClient.get<InvoiceAnalytics>("/invoices/analytics");
    return data;
  },
  create: async (values: InvoiceFormValues): Promise<Invoice> => {
    const { data } = await apiClient.post<Invoice>("/invoices", values);
    return data;
  },
  update: async (id: string, values: Partial<InvoiceFormValues>): Promise<Invoice> => {
    const { data } = await apiClient.patch<Invoice>(`/invoices/${id}`, values);
    return data;
  },
  issue: async (id: string): Promise<Invoice> => {
    const { data } = await apiClient.post<Invoice>(`/invoices/${id}/issue`);
    return data;
  },
  cancel: async (id: string): Promise<Invoice> => {
    const { data } = await apiClient.post<Invoice>(`/invoices/${id}/cancel`);
    return data;
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/invoices/${id}`);
  },
  exportJson: async (id: string): Promise<Record<string, unknown>> => {
    const { data } = await apiClient.get<Record<string, unknown>>(`/invoices/${id}/export/json`);
    return data;
  },
};
