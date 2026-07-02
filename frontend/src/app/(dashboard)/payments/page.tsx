"use client";
import { useState } from "react";
import { Receipt } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePayments, useRecordPayment, useRefundPayment } from "@/features/payments/hooks/use-payments";
import { paymentSchema, type PaymentFormValues } from "@/features/payments/validation/payment.schema";
import { useInvoices } from "@/features/invoices/hooks/use-invoices";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { extractErrorMessage } from "@/lib/api-error";
import { formatCurrency, formatDate } from "@/lib/format";

function RecordPaymentForm() {
  const { data: invoices } = useInvoices({ status: "ISSUED", limit: 100 });
  const record = useRecordPayment();
  const [success, setSuccess] = useState(false);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { paidAt: new Date().toISOString().split("T")[0] },
  });

  function onSubmit(values: PaymentFormValues) {
    record.mutate(values, {
      onSuccess: () => {
        form.reset({ paidAt: new Date().toISOString().split("T")[0] });
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      },
    });
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">Record payment</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Invoice *</Label>
            <select {...form.register("invoiceId")} className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <option value="">Select issued invoice</option>
              {invoices?.data.map((inv) => (
                <option key={inv.id} value={inv.id}>{inv.invoiceNumber} — {inv.customerName} ({formatCurrency(inv.grandTotal)})</option>
              ))}
            </select>
            {form.formState.errors.invoiceId && <p className="text-xs text-destructive">{form.formState.errors.invoiceId.message}</p>}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Amount (₹) *</Label>
              <Input type="number" step="0.01" {...form.register("amount", { valueAsNumber: true })} placeholder="0.00" className="figure-numeric" />
              {form.formState.errors.amount && <p className="text-xs text-destructive">{form.formState.errors.amount.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Payment date *</Label>
              <Input type="date" {...form.register("paidAt")} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Method</Label>
              <select {...form.register("method")} className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <option value="">Select method</option>
                {["Bank Transfer", "UPI", "Cheque", "Cash", "NEFT", "RTGS", "IMPS"].map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Reference</Label>
              <Input {...form.register("reference")} placeholder="UTR / Cheque no." className="figure-numeric" />
            </div>
          </div>

          {record.isError && <p className="rounded-md bg-crimson-soft px-3 py-2 text-sm text-destructive">{extractErrorMessage(record.error)}</p>}
          {success && <p className="rounded-md bg-secondary px-3 py-2 text-sm text-secondary-foreground">Payment recorded successfully.</p>}

          <Button type="submit" disabled={record.isPending} className="w-full">
            {record.isPending ? "Recording…" : "Record payment"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function PaymentsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = usePayments({ page, limit: 20 });
  const refund = useRefundPayment();

  return (
    <div className="space-y-5">
      <PageHeader title="Payments" description="Record and track payments against invoices." />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <RecordPaymentForm />
        </div>

        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold">Payment history</h2>

          {isLoading && <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>}

          {!isLoading && data?.data.length === 0 && (
            <EmptyState icon={Receipt} title="No payments recorded" description="Payments you record will appear here." />
          )}

          {!isLoading && data && data.data.length > 0 && (
            <>
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Invoice</th>
                      <th className="hidden px-4 py-2.5 text-left font-medium text-muted-foreground sm:table-cell">Customer</th>
                      <th className="hidden px-4 py-2.5 text-left font-medium text-muted-foreground md:table-cell">Date</th>
                      <th className="hidden px-4 py-2.5 text-left font-medium text-muted-foreground md:table-cell">Method</th>
                      <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Amount</th>
                      <th className="px-4 py-2.5 text-right font-medium text-muted-foreground w-20">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.map((p) => (
                      <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 figure-numeric font-medium">{p.invoiceNumber}</td>
                        <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{p.customerName}</td>
                        <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{formatDate(p.paidAt)}</td>
                        <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{p.method ?? "—"}</td>
                        <td className="px-4 py-3 text-right figure-numeric font-medium">{formatCurrency(p.amount)}</td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive text-xs"
                            disabled={refund.isPending}
                            onClick={() => { if (confirm("Refund this payment?")) refund.mutate(p.id); }}>
                            Refund
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {data.meta.totalPages > 1 && (
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                  <Button variant="outline" size="sm" disabled={page >= data.meta.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
