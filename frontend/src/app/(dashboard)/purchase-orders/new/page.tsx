"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreatePurchaseOrder } from "@/features/purchase-orders/hooks/use-purchase-orders";
import { purchaseOrderSchema, type PurchaseOrderFormValues } from "@/features/purchase-orders/validation/purchase-order.schema";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/page-header";
import { extractErrorMessage } from "@/lib/api-error";

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const create = useCreatePurchaseOrder();
  const { data: customers } = useCustomers({ limit: 100 });

  const { register, handleSubmit, formState: { errors } } = useForm<PurchaseOrderFormValues>({
    resolver: zodResolver(purchaseOrderSchema),
  });

  function onSubmit(values: PurchaseOrderFormValues) {
    create.mutate(values, { onSuccess: (po) => router.push(`/purchase-orders/${po.id}`) });
  }

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/purchase-orders"><ArrowLeft className="size-4" /></Link>
        </Button>
        <PageHeader title="New purchase order" description="A PO number will be auto-generated if left blank." />
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="customerId">Customer *</Label>
            <select
              id="customerId"
              {...register("customerId")}
              className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Select customer</option>
              {customers?.data.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.companyName ? ` — ${c.companyName}` : ""}
                </option>
              ))}
            </select>
            {errors.customerId && <p className="text-xs text-destructive">{errors.customerId.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="poNumber">PO number (optional)</Label>
            <Input
              id="poNumber"
              {...register("poNumber")}
              placeholder="Auto-generated if blank"
              className="figure-numeric"
            />
            <p className="text-xs text-muted-foreground">Leave blank to auto-generate (e.g. PO-2026-0001)</p>
          </div>

          {create.isError && (
            <p className="rounded-md bg-crimson-soft px-3 py-2 text-sm text-destructive">
              {extractErrorMessage(create.error)}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="outline" asChild><Link href="/purchase-orders">Cancel</Link></Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "Creating…" : "Create PO"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
