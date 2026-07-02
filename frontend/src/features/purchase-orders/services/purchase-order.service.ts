import { apiClient } from "@/lib/api-client";
import type { PaginatedPurchaseOrders, PurchaseOrder } from "@/features/purchase-orders/types/purchase-order.types";
import type { PurchaseOrderFormValues, UpdatePurchaseOrderValues } from "@/features/purchase-orders/validation/purchase-order.schema";

export interface PoListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  customerId?: string;
  sortOrder?: "asc" | "desc";
}

export const purchaseOrderApi = {
  list: async (params: PoListParams = {}): Promise<PaginatedPurchaseOrders> => {
    const { data } = await apiClient.get<PaginatedPurchaseOrders>("/purchase-orders", { params });
    return data;
  },
  getById: async (id: string): Promise<PurchaseOrder> => {
    const { data } = await apiClient.get<PurchaseOrder>(`/purchase-orders/${id}`);
    return data;
  },
  create: async (values: PurchaseOrderFormValues): Promise<PurchaseOrder> => {
    const { data } = await apiClient.post<PurchaseOrder>("/purchase-orders", values);
    return data;
  },
  update: async (id: string, values: UpdatePurchaseOrderValues): Promise<PurchaseOrder> => {
    const { data } = await apiClient.patch<PurchaseOrder>(`/purchase-orders/${id}`, values);
    return data;
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/purchase-orders/${id}`);
  },
};
