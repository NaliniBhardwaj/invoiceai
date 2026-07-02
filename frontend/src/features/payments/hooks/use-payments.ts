"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { paymentApi, type PaymentListParams } from "@/features/payments/services/payment.service";
import type { PaymentFormValues } from "@/features/payments/validation/payment.schema";
export const paymentKeys = {
  all: ["payments"] as const,
  list: (p: PaymentListParams) => ["payments", "list", p] as const,
};
export function usePayments(params: PaymentListParams = {}) {
  return useQuery({ queryKey: paymentKeys.list(params), queryFn: () => paymentApi.list(params) });
}
export function useRecordPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: PaymentFormValues) => paymentApi.record(v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: paymentKeys.all });
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}
export function useRefundPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => paymentApi.refund(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: paymentKeys.all });
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}
