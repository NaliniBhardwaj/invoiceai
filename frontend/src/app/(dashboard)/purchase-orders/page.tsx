"use client";
import { useState } from "react";
import Link from "next/link";
import { ClipboardList, Plus, Search } from "lucide-react";
import { usePurchaseOrders, useDeletePurchaseOrder } from "@/features/purchase-orders/hooks/use-purchase-orders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDate } from "@/lib/format";

const STATUS_FILTERS = ["ALL", "OPEN", "PARTIALLY_INVOICED", "CLOSED", "CANCELLED"] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

export default function PurchaseOrdersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [page, setPage] = useState(1);
  const deletePo = useDeletePurchaseOrder();

  const { data, isLoading, isError } = usePurchaseOrders({
    page,
    limit: 20,
    search: search || undefined,
    status: statusFilter === "ALL" ? undefined : statusFilter,
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Purchase Orders"
        description="Track purchase orders and link them to invoices."
        action={
          <Button asChild size="sm">
            <Link href="/purchase-orders/new">
              <Plus className="mr-1.5 size-4" />New PO
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search PO number, customer…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-8"
          />
        </div>
        <div className="flex gap-1">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                statusFilter === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {s === "ALL" ? "All" : s === "PARTIALLY_INVOICED" ? "Partial" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      )}

      {isError && (
        <p className="rounded-md bg-crimson-soft px-4 py-3 text-sm text-destructive">
          Failed to load purchase orders.
        </p>
      )}

      {!isLoading && !isError && data?.data.length === 0 && (
        <EmptyState
          icon={ClipboardList}
          title="No purchase orders"
          description="Create a purchase order to track customer commitments before invoicing."
          action={<Button asChild size="sm"><Link href="/purchase-orders/new">New PO</Link></Button>}
        />
      )}

      {!isLoading && data && data.data.length > 0 && (
        <>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">PO Number</th>
                  <th className="hidden px-4 py-2.5 text-left font-medium text-muted-foreground sm:table-cell">Customer</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Status</th>
                  <th className="hidden px-4 py-2.5 text-left font-medium text-muted-foreground md:table-cell">Invoices</th>
                  <th className="hidden px-4 py-2.5 text-left font-medium text-muted-foreground lg:table-cell">Created</th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((po) => (
                  <tr key={po.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/purchase-orders/${po.id}`} className="figure-numeric font-medium hover:text-primary">
                        {po.poNumber}
                      </Link>
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{po.customerName}</td>
                    <td className="px-4 py-3"><StatusBadge status={po.status} /></td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                      {po.invoiceCount} invoice{po.invoiceCount !== 1 ? "s" : ""}
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">{formatDate(po.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/purchase-orders/${po.id}`}>View</Link>
                        </Button>
                        {["CLOSED", "CANCELLED"].includes(po.status) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            disabled={deletePo.isPending}
                            onClick={() => { if (confirm(`Delete ${po.poNumber}?`)) deletePo.mutate(po.id); }}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.meta.totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{data.meta.total} purchase orders</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page >= data.meta.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
