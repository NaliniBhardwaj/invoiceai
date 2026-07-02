"use client";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
export default function InvoiceError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <AlertTriangle className="size-8 text-destructive" />
      <p className="text-sm font-medium">Couldn&apos;t load invoices</p>
      <p className="max-w-xs text-sm text-muted-foreground">Something went wrong. Try again or refresh the page.</p>
      <Button size="sm" onClick={reset}>Try again</Button>
    </div>
  );
}
