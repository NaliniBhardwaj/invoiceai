"use client";
import { useState } from "react";
import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { useInvoices } from "@/features/invoices/hooks/use-invoices";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency, formatDate } from "@/lib/format";

const STATUS_TABS = ["ALL", "DRAFT", "ISSUED", "PAID", "OVERDUE", "CANCELLED"] as const;
type StatusTab = typeof STATUS_TABS[number];

export default function InvoicesPage() {
  const [activeTab, setActiveTab] = useState<StatusTab>("ALL");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useInvoices({
    page,
    limit: 20,
    status: activeTab === "ALL" ? undefined : activeTab,
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Invoices"
        description="Create and manage invoices for all transaction types."
        action={
          <Button asChild size="sm">
            <Link href="/invoices/new"><Plus className="mr-1.5 size-4" />New invoice</Link>
          </Button>
        }
      />

      <div className="flex gap-1 border-b border-border">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setPage(1); }}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "ALL" ? "All" : tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {isLoading && <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>}
      {isError && <p className="rounded-md bg-crimson-soft px-4 py-3 text-sm text-destructive">Failed to load invoices.</p>}

      {!isLoading && !isError && data?.data.length === 0 && (
        <EmptyState
          icon={FileText}
          title="No invoices yet"
          description="Create your first invoice to start tracking revenue."
          action={<Button asChild size="sm"><Link href="/invoices/new">New invoice</Link></Button>}
        />
      )}

      {!isLoading && data && data.data.length > 0 && (
        <>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Invoice #</th>
                  <th className="hidden px-4 py-2.5 text-left font-medium text-muted-foreground sm:table-cell">Customer</th>
                  <th className="hidden px-4 py-2.5 text-left font-medium text-muted-foreground md:table-cell">Date</th>
                  <th className="hidden px-4 py-2.5 text-left font-medium text-muted-foreground md:table-cell">Due</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((inv) => (
                  <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/invoices/${inv.id}`} className="figure-numeric font-medium hover:text-primary">
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{inv.customerName}</td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{formatDate(inv.invoiceDate)}</td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{formatDate(inv.dueDate)}</td>
                    <td className="px-4 py-3"><StatusBadge status={inv.status} /></td>
                    <td className="px-4 py-3 text-right figure-numeric font-medium">{formatCurrency(inv.grandTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.meta.totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{data.meta.total} invoices</span>
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
