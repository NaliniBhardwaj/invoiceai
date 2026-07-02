"use client";
import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { useInvoice, useIssueInvoice, useCancelInvoice } from "@/features/invoices/hooks/use-invoices";
import { invoiceApi } from "@/features/invoices/services/invoice.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { PageHeader } from "@/components/shared/page-header";
import { formatCurrency, formatDate } from "@/lib/format";

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: invoice, isLoading } = useInvoice(id);
  const issue = useIssueInvoice();
  const cancel = useCancelInvoice();

  async function handleExportJson() {
    const data = await invoiceApi.exportJson(id);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${invoice?.invoiceNumber ?? "invoice"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-64 w-full" /></div>;
  if (!invoice) return <p className="text-muted-foreground">Invoice not found.</p>;

  const canIssue = invoice.status === "DRAFT";
  const canCancel = !["PAID", "CANCELLED"].includes(invoice.status);

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild><Link href="/invoices"><ArrowLeft className="size-4" /></Link></Button>
        <PageHeader
          title={invoice.invoiceNumber}
          description={`${invoice.customerName}${invoice.customerCompany ? ` · ${invoice.customerCompany}` : ""}`}
          action={
            <div className="flex items-center gap-2">
              <StatusBadge status={invoice.status} />
              <Button variant="outline" size="sm" onClick={handleExportJson}><Download className="mr-1.5 size-4" />JSON</Button>
              {canIssue && <Button size="sm" onClick={() => issue.mutate(id)} disabled={issue.isPending}>Issue invoice</Button>}
              {canCancel && !canIssue && <Button variant="outline" size="sm" onClick={() => { if (confirm("Cancel this invoice?")) cancel.mutate(id); }} disabled={cancel.isPending}>Cancel</Button>}
            </div>
          }
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Invoice details</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div><p className="text-xs text-muted-foreground">Invoice date</p><p>{formatDate(invoice.invoiceDate)}</p></div>
              <div><p className="text-xs text-muted-foreground">Due date</p><p>{formatDate(invoice.dueDate)}</p></div>
              <div><p className="text-xs text-muted-foreground">Type</p><p>{invoice.type.replace(/_/g, " ")}</p></div>
              {invoice.purchaseOrderNumber && <div><p className="text-xs text-muted-foreground">PO#</p><p className="figure-numeric">{invoice.purchaseOrderNumber}</p></div>}
              {invoice.subscriptionPlan && <div><p className="text-xs text-muted-foreground">Plan</p><p>{invoice.subscriptionPlan}</p></div>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Bill to</CardTitle></CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            <p className="font-medium">{invoice.customerName}</p>
            {invoice.customerCompany && <p className="text-muted-foreground">{invoice.customerCompany}</p>}
            {invoice.customerGstNumber && <p className="figure-numeric text-xs text-muted-foreground">{invoice.customerGstNumber}</p>}
            <p className="text-muted-foreground text-xs whitespace-pre-line">{invoice.customerBillingAddress}</p>
            <p className="text-muted-foreground text-xs">{invoice.customerState}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Line items</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Description</th>
                <th className="px-4 py-2.5 text-right font-medium text-muted-foreground w-20">Qty</th>
                <th className="px-4 py-2.5 text-right font-medium text-muted-foreground w-28">Unit price</th>
                <th className="px-4 py-2.5 text-right font-medium text-muted-foreground w-28">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.map((li) => (
                <tr key={li.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-2.5">{li.description}</td>
                  <td className="px-4 py-2.5 text-right figure-numeric text-muted-foreground">{li.quantity}</td>
                  <td className="px-4 py-2.5 text-right figure-numeric text-muted-foreground">{formatCurrency(li.unitPrice)}</td>
                  <td className="px-4 py-2.5 text-right figure-numeric font-medium">{formatCurrency(li.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t border-border px-4 py-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span className="figure-numeric">{formatCurrency(invoice.subtotal)}</span></div>
            {invoice.isIntraState ? (
              <>
                <div className="flex justify-between text-muted-foreground"><span>CGST ({Number(invoice.taxPercentage)/2}%)</span><span className="figure-numeric">{formatCurrency(invoice.cgst)}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>SGST ({Number(invoice.taxPercentage)/2}%)</span><span className="figure-numeric">{formatCurrency(invoice.sgst)}</span></div>
              </>
            ) : (
              <div className="flex justify-between text-muted-foreground"><span>IGST ({invoice.taxPercentage}%)</span><span className="figure-numeric">{formatCurrency(invoice.igst)}</span></div>
            )}
            <div className="flex justify-between border-t border-border pt-2 font-semibold"><span>Grand total</span><span className="figure-numeric text-base">{formatCurrency(invoice.grandTotal)}</span></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
