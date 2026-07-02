import { apiClient } from "@/lib/api-client";
import type { Customer, CustomerAnalytics, CustomerHistory, PaginatedCustomers } from "@/features/customers/types/customer.types";
import type { CustomerFormValues } from "@/features/customers/validation/customer.schema";

export interface CustomerListParams {
  page?: number;
  limit?: number;
  search?: string;
  state?: string;
  sortOrder?: "asc" | "desc";
}

export const customerApi = {
  list: async (params: CustomerListParams = {}): Promise<PaginatedCustomers> => {
    const { data } = await apiClient.get<PaginatedCustomers>("/customers", { params });
    return data;
  },
  getById: async (id: string): Promise<Customer> => {
    const { data } = await apiClient.get<Customer>(`/customers/${id}`);
    return data;
  },
  getHistory: async (id: string): Promise<CustomerHistory> => {
    const { data } = await apiClient.get<CustomerHistory>(`/customers/${id}/history`);
    return data;
  },
  getAnalytics: async (): Promise<CustomerAnalytics> => {
    const { data } = await apiClient.get<CustomerAnalytics>("/customers/analytics");
    return data;
  },
  create: async (values: CustomerFormValues): Promise<Customer> => {
    const { data } = await apiClient.post<Customer>("/customers", values);
    return data;
  },
  update: async (id: string, values: Partial<CustomerFormValues>): Promise<Customer> => {
    const { data } = await apiClient.patch<Customer>(`/customers/${id}`, values);
    return data;
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/customers/${id}`);
  },
};
