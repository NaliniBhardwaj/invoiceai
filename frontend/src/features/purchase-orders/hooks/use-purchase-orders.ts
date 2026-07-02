"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { purchaseOrderApi, type PoListParams } from "@/features/purchase-orders/services/purchase-order.service";
import type { PurchaseOrderFormValues, UpdatePurchaseOrderValues } from "@/features/purchase-orders/validation/purchase-order.schema";

export const poKeys = {
  all: ["purchase-orders"] as const,
  list: (p: PoListParams) => ["purchase-orders", "list", p] as const,
  detail: (id: string) => ["purchase-orders", id] as const,
};

export function usePurchaseOrders(params: PoListParams = {}) {
  return useQuery({
    queryKey: poKeys.list(params),
    queryFn: () => purchaseOrderApi.list(params),
  });
}

export function usePurchaseOrder(id: string) {
  return useQuery({
    queryKey: poKeys.detail(id),
    queryFn: () => purchaseOrderApi.getById(id),
    enabled: !!id,
  });
}

export function useCreatePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: PurchaseOrderFormValues) => purchaseOrderApi.create(values),
    onSuccess: () => qc.invalidateQueries({ queryKey: poKeys.all }),
  });
}

export function useUpdatePurchaseOrder(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: UpdatePurchaseOrderValues) => purchaseOrderApi.update(id, values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: poKeys.detail(id) });
      qc.invalidateQueries({ queryKey: poKeys.all });
    },
  });
}

export function useDeletePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => purchaseOrderApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: poKeys.all }),
  });
}
