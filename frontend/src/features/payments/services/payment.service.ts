import { apiClient } from "@/lib/api-client";
import type { Payment, PaginatedPayments } from "@/features/payments/types/payment.types";
import type { PaymentFormValues } from "@/features/payments/validation/payment.schema";
export interface PaymentListParams { page?: number; limit?: number; invoiceId?: string; search?: string; }
export const paymentApi = {
  list: async (p: PaymentListParams = {}): Promise<PaginatedPayments> => (await apiClient.get<PaginatedPayments>("/payments", { params: p })).data,
  record: async (v: PaymentFormValues): Promise<Payment> => (await apiClient.post<Payment>("/payments", v)).data,
  refund: async (id: string): Promise<void> => { await apiClient.delete(`/payments/${id}`); },
};
