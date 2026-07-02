"use client";
import { useState } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useReconciliationRuns,
  useStartReconciliation,
} from "@/features/reconciliation/hooks/use-reconciliation";
import {
  startReconciliationSchema,
  type StartReconciliationValues,
} from "@/features/reconciliation/validation/reconciliation.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { extractErrorMessage } from "@/lib/api-error";
import { formatDate } from "@/lib/format";

const CSV_SAMPLE = `gstin,invoicenumber,invoicedate,taxablevalue,igst,cgst,sgst,total
27AAPFU0939F1ZV,INV-2026-00001,2026-03-01,10000,0,900,900,11800`;

function StartRunForm() {
  const start = useStartReconciliation();
  const [fileContent, setFileContent] = useState("");

  const { register, handleSubmit, setValue, control, formState: { errors }, reset } = useForm<StartReconciliationValues>({
    resolver: zodResolver(startReconciliationSchema),
    defaultValues: { sourceType: "GST_CSV", period: new Date().toISOString().slice(0, 7) },
  });

  const sourceType = useWatch({ control, name: "sourceType" });

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setFileContent(text);
    setValue("sourceData", text);
  }

  function onSubmit(values: StartReconciliationValues) {
    start.mutate(values, {
      onSuccess: () => {
        reset({ sourceType: "GST_CSV", period: new Date().toISOString().slice(0, 7) });
        setFileContent("");
      },
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Start reconciliation run</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Period *</Label>
              <Input {...register("period")} placeholder="2026-03" className="figure-numeric" />
              {errors.period && <p className="text-xs text-destructive">{errors.period.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Source format *</Label>
              <select
                {...register("sourceType")}
                className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="GST_CSV">GST CSV</option>
                <option value="GST_JSON">GST JSON</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Upload file</Label>
            <input
              type="file"
              accept={sourceType === "GST_CSV" ? ".csv" : ".json"}
              onChange={handleFileUpload}
              className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-border file:bg-card file:px-3 file:py-1.5 file:text-xs file:font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Or paste data directly</Label>
            <textarea
              {...register("sourceData")}
              rows={6}
              value={fileContent || undefined}
              onChange={(e) => { setFileContent(e.target.value); setValue("sourceData", e.target.value); }}
              placeholder={sourceType === "GST_CSV" ? CSV_SAMPLE : '{"entries": [...]}'}
              className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-xs font-mono shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
            {errors.sourceData && <p className="text-xs text-destructive">{errors.sourceData.message}</p>}
          </div>

          {start.isError && (
            <p className="rounded-md bg-crimson-soft px-3 py-2 text-sm text-destructive">
              {extractErrorMessage(start.error)}
            </p>
          )}

          {start.isSuccess && (
            <p className="rounded-md bg-secondary px-3 py-2 text-sm text-secondary-foreground">
              Reconciliation started. Check the run history below for results.
            </p>
          )}

          <Button type="submit" disabled={start.isPending} className="w-full">
            {start.isPending ? "Starting…" : "Run reconciliation"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function ReconciliationPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useReconciliationRuns({ page, limit: 10 });

  return (
    <div className="space-y-5">
      <PageHeader
        title="GST Reconciliation"
        description="Upload GST portal data to detect mismatches with your invoices."
      />

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <StartRunForm />
        </div>

        <div className="lg:col-span-3 space-y-4">
          <h2 className="text-sm font-semibold">Run history</h2>

          {isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          )}

          {!isLoading && data?.data.length === 0 && (
            <EmptyState
              icon={ShieldCheck}
              title="No runs yet"
              description="Start your first reconciliation run to detect GST discrepancies."
            />
          )}

          {!isLoading && data && data.data.length > 0 && (
            <>
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Period</th>
                      <th className="hidden px-4 py-2.5 text-left font-medium text-muted-foreground sm:table-cell">Source</th>
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Status</th>
                      <th className="hidden px-4 py-2.5 text-right font-medium text-muted-foreground md:table-cell">Findings</th>
                      <th className="hidden px-4 py-2.5 text-left font-medium text-muted-foreground lg:table-cell">Run at</th>
                      <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Report</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.map((run) => (
                      <tr key={run.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 figure-numeric font-medium">{run.period}</td>
                        <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell text-xs">{run.sourceType.replace("_", " ")}</td>
                        <td className="px-4 py-3">
                          {run.status === "PROCESSING" ? (
                            <span className="flex items-center gap-1.5 text-xs text-amber">
                              <span className="size-1.5 rounded-full bg-amber animate-pulse" />Processing
                            </span>
                          ) : (
                            <StatusBadge status={run.status} />
                          )}
                        </td>
                        <td className="hidden px-4 py-3 text-right figure-numeric md:table-cell">
                          {run.status === "COMPLETED" ? (
                            <span className={run.findingCount > 0 ? "text-amber font-medium" : "text-muted-foreground"}>
                              {run.findingCount}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">{formatDate(run.createdAt)}</td>
                        <td className="px-4 py-3 text-right">
                          {run.status === "COMPLETED" ? (
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/reconciliation/${run.id}`}>View report</Link>
                            </Button>
                          ) : "—"}
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
