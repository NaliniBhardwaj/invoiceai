"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { customerSchema, type CustomerFormValues } from "@/features/customers/validation/customer.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { extractErrorMessage } from "@/lib/api-error";

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan",
  "Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Delhi","Jammu and Kashmir","Ladakh","Chandigarh","Puducherry",
];

interface CustomerFormProps {
  defaultValues?: Partial<CustomerFormValues>;
  onSubmit: (values: CustomerFormValues) => void;
  isPending: boolean;
  error: unknown;
  submitLabel?: string;
}

export function CustomerForm({ defaultValues, onSubmit, isPending, error, submitLabel = "Save customer" }: CustomerFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Customer name *</Label>
          <Input id="name" {...register("name")} placeholder="Rahul Sharma" />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="companyName">Company name</Label>
          <Input id="companyName" {...register("companyName")} placeholder="Sharma Enterprises" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="gstNumber">GSTIN</Label>
          <Input id="gstNumber" {...register("gstNumber")} placeholder="27AAPFU0939F1ZV" className="figure-numeric" />
          {errors.gstNumber && <p className="text-xs text-destructive">{errors.gstNumber.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="state">State *</Label>
          <select
            id="state"
            {...register("state")}
            className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Select state</option>
            {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {errors.state && <p className="text-xs text-destructive">{errors.state.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="billingAddress">Billing address *</Label>
        <textarea
          id="billingAddress"
          {...register("billingAddress")}
          rows={3}
          className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
          placeholder="123 Main Street, Mumbai 400001"
        />
        {errors.billingAddress && <p className="text-xs text-destructive">{errors.billingAddress.message}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register("email")} placeholder="rahul@example.com" />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" {...register("phone")} placeholder="+91 98765 43210" />
        </div>
      </div>

      {!!error && (
        <p className="rounded-md bg-crimson-soft px-3 py-2 text-sm text-destructive">
          {extractErrorMessage(error)}
        </p>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
