"use client";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { invoiceSchema, INVOICE_TYPES, GST_RATES, type InvoiceFormValues } from "@/features/invoices/validation/invoice.schema";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { extractErrorMessage } from "@/lib/api-error";
import { formatCurrency } from "@/lib/format";

interface InvoiceFormProps {
  onSubmit: (values: InvoiceFormValues) => void;
  isPending: boolean;
  error: unknown;
}

function LineTotal({ qty, price }: { qty: number; price: number }) {
  const total = (qty || 0) * (price || 0);
  return <span className="figure-numeric text-sm text-muted-foreground">{formatCurrency(total)}</span>;
}

function TaxPreview({ lineItems, taxPct }: { lineItems: Array<{ quantity: number; unitPrice: number }>; taxPct: number }) {
  const subtotal = lineItems.reduce((s, li) => s + (li.quantity || 0) * (li.unitPrice || 0), 0);
  const tax = subtotal * (taxPct || 0) / 100;
  const total = subtotal + tax;
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2 text-sm">
      <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="figure-numeric">{formatCurrency(subtotal)}</span></div>
      <div className="flex justify-between"><span className="text-muted-foreground">GST ({taxPct}%)</span><span className="figure-numeric">{formatCurrency(tax)}</span></div>
      <div className="flex justify-between border-t border-border pt-2 font-semibold"><span>Grand total</span><span className="figure-numeric">{formatCurrency(total)}</span></div>
    </div>
  );
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}
function thirtyDaysOutISO() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split("T")[0];
}

export function InvoiceForm({ onSubmit, isPending, error }: InvoiceFormProps) {
  const { data: customers } = useCustomers({ limit: 100 });

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      type: "ONE_TIME",
      taxPercentage: 18,
      invoiceDate: todayISO(),
      dueDate: thirtyDaysOutISO(),
      lineItems: [{ description: "", quantity: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "lineItems" });
  const watchedItems = useWatch({ control: form.control, name: "lineItems" });
  const watchedTax = useWatch({ control: form.control, name: "taxPercentage" });
  const watchedType = useWatch({ control: form.control, name: "type" });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Customer *</Label>
          <select {...form.register("customerId")} className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <option value="">Select customer</option>
            {customers?.data.map((c) => <option key={c.id} value={c.id}>{c.name}{c.companyName ? ` — ${c.companyName}` : ""}</option>)}
          </select>
          {form.formState.errors.customerId && <p className="text-xs text-destructive">{form.formState.errors.customerId.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Invoice type *</Label>
          <select {...form.register("type")} className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {INVOICE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      </div>

      {(watchedType === "SUBSCRIPTION_NEW" || watchedType === "SUBSCRIPTION_RENEWAL") && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Subscription plan</Label>
            <Input {...form.register("subscriptionPlan")} placeholder="Pro Monthly" />
          </div>
          <div className="space-y-1.5">
            <Label>Duration (months)</Label>
            <Input type="number" {...form.register("subscriptionDuration", { valueAsNumber: true })} placeholder="12" />
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label>Invoice date *</Label>
          <Input type="date" {...form.register("invoiceDate")} />
          {form.formState.errors.invoiceDate && <p className="text-xs text-destructive">{form.formState.errors.invoiceDate.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Due date *</Label>
          <Input type="date" {...form.register("dueDate")} />
          {form.formState.errors.dueDate && <p className="text-xs text-destructive">{form.formState.errors.dueDate.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>GST rate *</Label>
          <select {...form.register("taxPercentage", { valueAsNumber: true })} className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {GST_RATES.map((r) => <option key={r} value={r}>{r}%</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Line items *</Label>
          <Button type="button" variant="outline" size="sm" onClick={() => append({ description: "", quantity: 1, unitPrice: 0 })}>
            <Plus className="mr-1.5 size-3.5" />Add item
          </Button>
        </div>

        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/50">
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Description</th>
              <th className="w-24 px-3 py-2 text-right font-medium text-muted-foreground">Qty</th>
              <th className="w-32 px-3 py-2 text-right font-medium text-muted-foreground">Unit price</th>
              <th className="w-28 px-3 py-2 text-right font-medium text-muted-foreground">Total</th>
              <th className="w-10 px-3 py-2" />
            </tr></thead>
            <tbody>
              {fields.map((field, i) => (
                <tr key={field.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2">
                    <Input {...form.register(`lineItems.${i}.description`)} placeholder="Service description" className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0" />
                    {form.formState.errors.lineItems?.[i]?.description && <p className="text-xs text-destructive">{form.formState.errors.lineItems[i]?.description?.message}</p>}
                  </td>
                  <td className="px-3 py-2">
                    <Input type="number" step="0.01" {...form.register(`lineItems.${i}.quantity`, { valueAsNumber: true })} className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 text-right figure-numeric" />
                  </td>
                  <td className="px-3 py-2">
                    <Input type="number" step="0.01" {...form.register(`lineItems.${i}.unitPrice`, { valueAsNumber: true })} className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 text-right figure-numeric" />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <LineTotal qty={watchedItems?.[i]?.quantity ?? 0} price={watchedItems?.[i]?.unitPrice ?? 0} />
                  </td>
                  <td className="px-3 py-2 text-center">
                    {fields.length > 1 && (
                      <button type="button" onClick={() => remove(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {form.formState.errors.lineItems?.root && <p className="text-xs text-destructive">{form.formState.errors.lineItems.root.message}</p>}
      </div>

      <TaxPreview lineItems={watchedItems ?? []} taxPct={watchedTax ?? 18} />

      {!!error && <p className="rounded-md bg-crimson-soft px-3 py-2 text-sm text-destructive">{extractErrorMessage(error)}</p>}

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isPending}>{isPending ? "Creating…" : "Create invoice"}</Button>
      </div>
    </form>
  );
}
