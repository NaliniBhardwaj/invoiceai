"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterFormValues } from "@/features/auth/validation/auth.schema";
import { useRegister } from "@/features/auth/hooks/use-register";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const registerAccount = useRegister();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  function onSubmit(values: RegisterFormValues) {
    registerAccount.mutate(values);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Create your organization</h1>
        <p className="text-sm text-muted-foreground">
          You&apos;ll be the owner — invite your team once you&apos;re in.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="organizationName">Organization name</Label>
          <Input id="organizationName" {...register("organizationName")} />
          {errors.organizationName && (
            <p className="text-sm text-destructive">{errors.organizationName.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="organizationState">State</Label>
            <Input id="organizationState" placeholder="Maharashtra" {...register("organizationState")} />
            {errors.organizationState && (
              <p className="text-sm text-destructive">{errors.organizationState.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="organizationGstNumber">GSTIN (optional)</Label>
            <Input id="organizationGstNumber" {...register("organizationGstNumber")} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Your name</Label>
          <Input id="name" {...register("name")} />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...register("email")} />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
          {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
        </div>

        {registerAccount.isError && (
          <p className="rounded-md bg-crimson-soft px-3 py-2 text-sm text-destructive">
            {(registerAccount.error as { response?: { data?: { error?: { message?: string } } } })?.response?.data
              ?.error?.message ?? "Couldn't create your account — try again."}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={registerAccount.isPending}>
          {registerAccount.isPending ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
