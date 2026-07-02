"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <AlertTriangle className="size-8 text-destructive" />
      <p className="text-sm font-medium">Couldn&apos;t load the dashboard</p>
      <p className="max-w-xs text-sm text-muted-foreground">
        Something went wrong fetching your data. Try again, or check your connection.
      </p>
      <Button size="sm" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
