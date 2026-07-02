"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useCreateCustomer } from "@/features/customers/hooks/use-customers";
import { CustomerForm } from "@/features/customers/components/customer-form";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import type { CustomerFormValues } from "@/features/customers/validation/customer.schema";

export default function NewCustomerPage() {
  const router = useRouter();
  const create = useCreateCustomer();

  function onSubmit(values: CustomerFormValues) {
    create.mutate(values, { onSuccess: (c) => router.push(`/customers/${c.id}`) });
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild><Link href="/customers"><ArrowLeft className="size-4" /></Link></Button>
        <PageHeader title="Add customer" description="Create a new customer record." />
      </div>
      <div className="rounded-lg border border-border bg-card p-6">
        <CustomerForm onSubmit={onSubmit} isPending={create.isPending} error={create.error} submitLabel="Create customer" />
      </div>
    </div>
  );
}
