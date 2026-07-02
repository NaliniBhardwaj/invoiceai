"use client";
import { use } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Plus } from "lucide-react";
import { usePurchaseOrder, useUpdatePurchaseOrder } from "@/features/purchase-orders/hooks/use-purchase-orders";
import { useInvoices } from "@/features/invoices/hooks/use-invoices";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency, formatDate } from "@/lib/format";
import { extractErrorMessage } from "@/lib/api-error";

const TRANSITIONS: Record<string, Array<{ label: string; status: "OPEN" | "PARTIALLY_INVOICED" | "CLOSED" | "CANCELLED" }>> = {
  OPEN: [{ label: "Close PO", status: "CLOSED" }, { label: "Cancel", status: "CANCELLED" }],
  PARTIALLY_INVOICED: [{ label: "Close PO", status: "CLOSED" }, { label: "Cancel", status: "CANCELLED" }],
  CLOSED: [],
  CANCELLED: [],
};

export default function PurchaseOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: po, isLoading } = usePurchaseOrder(id);
  const update = useUpdatePurchaseOrder(id);
  const { data: invoicesData } = useInvoices({ customerId: po?.customerId });

  if (isLoading) return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
  if (!po) return <p className="text-muted-foreground">Purchase order not found.</p>;

  const linkedInvoices = invoicesData?.data.filter(inv => inv.purchaseOrderId === id) ?? [];
  const transitions = TRANSITIONS[po.status] ?? [];

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/purchase-orders"><ArrowLeft className="size-4" /></Link>
        </Button>
        <PageHeader
          title={po.poNumber}
          description={`${po.customerName}${po.customerGstNumber ? ` · ${po.customerGstNumber}` : ""}`}
          action={
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={po.status} />
              {transitions.map((t) => (
                <Button
                  key={t.status}
                  variant="outline"
                  size="sm"
                  disabled={update.isPending}
                  onClick={() => { if (confirm(`${t.label}?`)) update.mutate({ status: t.status }); }}
                >
                  {t.label}
                </Button>
              ))}
              {po.status === "OPEN" && (
                <Button size="sm" asChild>
                  <Link href={`/invoices/new?poId=${id}&customerId=${po.customerId}`}>
                    <Plus className="mr-1.5 size-4" />Create invoice
                  </Link>
                </Button>
              )}
            </div>
          }
        />
      </div>

      {update.isError && (
        <p className="rounded-md bg-crimson-soft px-4 py-2 text-sm text-destructive">
          {extractErrorMessage(update.error)}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Details</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div><p className="text-xs text-muted-foreground">PO number</p><p className="figure-numeric font-medium">{po.poNumber}</p></div>
            <div><p className="text-xs text-muted-foreground">Customer</p><p className="font-medium">{po.customerName}</p></div>
            {po.customerGstNumber && <div><p className="text-xs text-muted-foreground">GSTIN</p><p className="figure-numeric text-xs">{po.customerGstNumber}</p></div>}
            <div><p className="text-xs text-muted-foreground">Status</p><div className="mt-0.5"><StatusBadge status={po.status} /></div></div>
            <div><p className="text-xs text-muted-foreground">Created</p><p>{formatDate(po.createdAt)}</p></div>
            <div><p className="text-xs text-muted-foreground">Invoices linked</p><p>{po.invoiceCount}</p></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileText className="size-4" />Linked invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            {linkedInvoices.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No invoices yet"
                description="Create an invoice against this PO."
                className="border-none px-0 py-4"
              />
            ) : (
              <div className="space-y-2">
                {linkedInvoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between text-sm">
                    <Link href={`/invoices/${inv.id}`} className="figure-numeric font-medium hover:text-primary">
                      {inv.invoiceNumber}
                    </Link>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={inv.status} />
                      <span className="figure-numeric text-muted-foreground">{formatCurrency(inv.grandTotal)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
