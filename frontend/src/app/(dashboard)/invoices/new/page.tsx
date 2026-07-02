"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useCreateInvoice } from "@/features/invoices/hooks/use-invoices";
import { InvoiceForm } from "@/features/invoices/components/invoice-form";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import type { InvoiceFormValues } from "@/features/invoices/validation/invoice.schema";

export default function NewInvoicePage() {
  const router = useRouter();
  const create = useCreateInvoice();

  function onSubmit(values: InvoiceFormValues) {
    create.mutate(values, { onSuccess: (inv) => router.push(`/invoices/${inv.id}`) });
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild><Link href="/invoices"><ArrowLeft className="size-4" /></Link></Button>
        <PageHeader title="New invoice" description="Create an invoice with automatic GST calculation." />
      </div>
      <div className="rounded-lg border border-border bg-card p-6">
        <InvoiceForm onSubmit={onSubmit} isPending={create.isPending} error={create.error} />
      </div>
    </div>
  );
}
