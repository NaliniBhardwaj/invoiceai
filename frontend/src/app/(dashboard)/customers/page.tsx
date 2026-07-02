"use client";
import { useState } from "react";
import Link from "next/link";
import { Plus, Search, Users } from "lucide-react";
import { useCustomers, useDeleteCustomer } from "@/features/customers/hooks/use-customers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDate } from "@/lib/format";

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const deleteCustomer = useDeleteCustomer();

  const { data, isLoading, isError } = useCustomers({ page, limit: 20, search: search || undefined });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Customers"
        description="Manage your customer records and GST details."
        action={
          <Button asChild size="sm">
            <Link href="/customers/new"><Plus className="mr-1.5 size-4" />Add customer</Link>
          </Button>
        }
      />

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, GSTIN…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-8"
        />
      </div>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      )}

      {isError && (
        <p className="rounded-md bg-crimson-soft px-4 py-3 text-sm text-destructive">
          Failed to load customers.
        </p>
      )}

      {!isLoading && !isError && data?.data.length === 0 && (
        <EmptyState
          icon={Users}
          title="No customers yet"
          description="Add your first customer to start creating invoices."
          action={<Button asChild size="sm"><Link href="/customers/new">Add customer</Link></Button>}
        />
      )}

      {!isLoading && data && data.data.length > 0 && (
        <>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Name</th>
                  <th className="hidden px-4 py-2.5 text-left font-medium text-muted-foreground sm:table-cell">Company</th>
                  <th className="hidden px-4 py-2.5 text-left font-medium text-muted-foreground md:table-cell">GSTIN</th>
                  <th className="hidden px-4 py-2.5 text-left font-medium text-muted-foreground lg:table-cell">State</th>
                  <th className="hidden px-4 py-2.5 text-left font-medium text-muted-foreground lg:table-cell">Added</th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((customer) => (
                  <tr key={customer.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/customers/${customer.id}`} className="font-medium hover:text-primary">
                        {customer.name}
                      </Link>
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{customer.companyName ?? "—"}</td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      {customer.gstNumber
                        ? <span className="figure-numeric text-xs">{customer.gstNumber}</span>
                        : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">{customer.state}</td>
                    <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">{formatDate(customer.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/customers/${customer.id}`}>View</Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          disabled={deleteCustomer.isPending}
                          onClick={() => {
                            if (confirm(`Delete ${customer.name}?`)) deleteCustomer.mutate(customer.id);
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.meta.totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{data.meta.total} customers</span>
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
