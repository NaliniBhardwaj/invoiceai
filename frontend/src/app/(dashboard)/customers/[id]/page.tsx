"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, FileText, Receipt } from "lucide-react";
import { use } from "react";
import { useCustomer, useCustomerHistory, useUpdateCustomer } from "@/features/customers/hooks/use-customers";
import { CustomerForm } from "@/features/customers/components/customer-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { PageHeader } from "@/components/shared/page-header";
import { formatCurrency, formatDate } from "@/lib/format";
import type { CustomerFormValues } from "@/features/customers/validation/customer.schema";

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [editing, setEditing] = useState(false);
  const { data: customer, isLoading } = useCustomer(id);
  const { data: history } = useCustomerHistory(id);
  const update = useUpdateCustomer(id);

  function onSubmit(values: CustomerFormValues) {
    update.mutate(values, { onSuccess: () => setEditing(false) });
  }

  if (isLoading) return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-48 w-full" />
    </div>
  );

  if (!customer) return <p className="text-muted-foreground">Customer not found.</p>;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild><Link href="/customers"><ArrowLeft className="size-4" /></Link></Button>
        <PageHeader
          title={customer.name}
          description={customer.companyName ?? undefined}
          action={<Button variant="outline" size="sm" onClick={() => setEditing(!editing)}>{editing ? "Cancel" : "Edit"}</Button>}
        />
      </div>

      {editing ? (
        <div className="rounded-lg border border-border bg-card p-6">
          <CustomerForm
            defaultValues={{
              name: customer.name,
              companyName: customer.companyName ?? undefined,
              gstNumber: customer.gstNumber ?? undefined,
              billingAddress: customer.billingAddress,
              state: customer.state,
              email: customer.email ?? undefined,
              phone: customer.phone ?? undefined,
            }}
            onSubmit={onSubmit}
            isPending={update.isPending}
            error={update.error}
            submitLabel="Save changes"
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Building2 className="size-4" />Details</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              {customer.gstNumber && <div><p className="text-xs text-muted-foreground">GSTIN</p><p className="figure-numeric font-medium">{customer.gstNumber}</p></div>}
              <div><p className="text-xs text-muted-foreground">State</p><p className="font-medium">{customer.state}</p></div>
              <div><p className="text-xs text-muted-foreground">Address</p><p className="text-muted-foreground whitespace-pre-line">{customer.billingAddress}</p></div>
              {customer.email && <div><p className="text-xs text-muted-foreground">Email</p><p>{customer.email}</p></div>}
              {customer.phone && <div><p className="text-xs text-muted-foreground">Phone</p><p>{customer.phone}</p></div>}
              <div><p className="text-xs text-muted-foreground">Customer since</p><p>{formatDate(customer.createdAt)}</p></div>
            </CardContent>
          </Card>

          {history && (
            <div className="space-y-4">
              {history.invoices.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><FileText className="size-4" />Invoices</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {history.invoices.slice(0, 5).map((inv) => (
                      <div key={inv.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Link href={`/invoices/${inv.id}`} className="figure-numeric font-medium hover:text-primary">{inv.invoiceNumber}</Link>
                          <StatusBadge status={inv.status} />
                        </div>
                        <span className="figure-numeric text-muted-foreground">{formatCurrency(inv.grandTotal)}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {history.payments.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Receipt className="size-4" />Payments</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {history.payments.slice(0, 5).map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{formatDate(p.paidAt)}</span>
                        <span className="figure-numeric font-medium">{formatCurrency(p.amount)}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
