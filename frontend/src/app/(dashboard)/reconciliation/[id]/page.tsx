"use client";
import { use } from "react";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import {
  useReconciliationRun,
  useReconciliationReport,
} from "@/features/reconciliation/hooks/use-reconciliation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { formatDate } from "@/lib/format";

const SEVERITY_COLORS: Record<string, string> = {
  HIGH: "bg-crimson-soft text-crimson",
  MEDIUM: "bg-amber-soft text-amber",
  LOW: "bg-secondary text-secondary-foreground",
};

export default function ReconciliationReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: run, isLoading: runLoading } = useReconciliationRun(id);
  const { data: report, isLoading: reportLoading } = useReconciliationReport(
    id,
    run?.status === "COMPLETED"
  );

  if (runLoading) return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-48 w-full" />
    </div>
  );

  if (!run) return <p className="text-muted-foreground">Run not found.</p>;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/reconciliation"><ArrowLeft className="size-4" /></Link>
        </Button>
        <PageHeader
          title={`Reconciliation — ${run.period}`}
          description={`Run ${run.id.slice(0, 8)}… · ${formatDate(run.createdAt)}`}
        />
      </div>

      {run.status === "PROCESSING" && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-amber-soft px-5 py-4">
          <Loader2 className="size-5 animate-spin text-amber" />
          <div>
            <p className="text-sm font-medium text-amber">Processing reconciliation…</p>
            <p className="text-xs text-muted-foreground">This page refreshes automatically every 3 seconds.</p>
          </div>
        </div>
      )}

      {run.status === "FAILED" && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-crimson-soft px-5 py-4">
          <AlertTriangle className="size-5 text-crimson" />
          <p className="text-sm font-medium text-destructive">Reconciliation failed. Check your source data and try again.</p>
        </div>
      )}

      {run.status === "COMPLETED" && !reportLoading && report && (
        <>
          {/* Summary cards */}
          <div className="grid gap-3 sm:grid-cols-3">
            <Card>
              <CardContent className="pt-5 text-center">
                {report.summary.totalFindings === 0 ? (
                  <CheckCircle className="mx-auto mb-2 size-8 text-secondary-foreground" />
                ) : (
                  <AlertTriangle className="mx-auto mb-2 size-8 text-amber" />
                )}
                <p className="figure-numeric text-2xl font-bold">{report.summary.totalFindings}</p>
                <p className="text-xs text-muted-foreground">Total findings</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 text-center">
                <p className="figure-numeric text-2xl font-bold">{report.gstMismatches.length + report.taxDifferences.length}</p>
                <p className="text-xs text-muted-foreground">GST / tax issues</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 text-center">
                <p className="figure-numeric text-2xl font-bold">{report.unpaidInvoices.length}</p>
                <p className="text-xs text-muted-foreground">Unpaid invoices</p>
              </CardContent>
            </Card>
          </div>

          {/* By finding type */}
          {report.summary.byType.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Findings by type</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {report.summary.byType.map((t) => (
                    <div key={t.type} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`rounded px-2 py-0.5 text-xs font-medium ${SEVERITY_COLORS[t.severity] ?? ""}`}>
                          {t.severity}
                        </span>
                        <span>{t.type.replace(/_/g, " ")}</span>
                      </div>
                      <Badge variant="outline" className="figure-numeric">{t.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* GST Mismatches */}
          {report.gstMismatches.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">GST number mismatches</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {report.gstMismatches.map((f, i) => (
                    <div key={i} className="rounded-md border border-border p-3 text-sm space-y-1">
                      <p className="font-medium">{f.description}</p>
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        {f.expected && <div><span className="font-medium text-secondary-foreground">Expected: </span><span className="figure-numeric">{f.expected}</span></div>}
                        {f.actual && <div><span className="font-medium text-destructive">Actual: </span><span className="figure-numeric">{f.actual}</span></div>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tax differences */}
          {report.taxDifferences.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Tax amount differences</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {report.taxDifferences.map((f, i) => (
                    <div key={i} className="rounded-md border border-border p-3 text-sm space-y-1">
                      <p className="font-medium">{f.description}</p>
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        {f.expected && <div><span className="font-medium text-secondary-foreground">System: </span><span className="figure-numeric">₹{f.expected}</span></div>}
                        {f.actual && <div><span className="font-medium text-destructive">GST file: </span><span className="figure-numeric">₹{f.actual}</span></div>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Unpaid invoices */}
          {report.unpaidInvoices.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Unpaid invoices</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {report.unpaidInvoices.map((f, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{f.description}</span>
                      {f.invoiceId && (
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/invoices/${f.invoiceId}`}>View invoice</Link>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {report.summary.totalFindings === 0 && (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary px-5 py-4">
              <CheckCircle className="size-5 text-secondary-foreground" />
              <p className="text-sm font-medium text-secondary-foreground">
                No discrepancies found for {report.period}. Your invoices match the GST data.
              </p>
            </div>
          )}
        </>
      )}

      {run.status === "COMPLETED" && reportLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      )}
    </div>
  );
}
