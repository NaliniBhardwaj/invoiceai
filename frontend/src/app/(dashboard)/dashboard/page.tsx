"use client";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { FileText, IndianRupee, Receipt, ShieldCheck, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { useDashboard } from "@/features/dashboard/hooks/use-dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency } from "@/lib/format";

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  trend,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  trend?: number;
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-4 pt-5">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary">
          <Icon className="size-5 text-secondary-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="figure-numeric mt-0.5 text-xl font-semibold">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
          {trend !== undefined && (
            <p className={`mt-0.5 flex items-center gap-1 text-xs font-medium ${trend >= 0 ? "text-secondary-foreground" : "text-destructive"}`}>
              {trend >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
              {Math.abs(trend)}% vs last month
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-64 lg:col-span-2" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading, isError } = useDashboard();

  if (isLoading) return <DashboardSkeleton />;

  if (isError || !data) {
    return (
      <div className="space-y-5">
        <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
        <EmptyState
          icon={Sparkles}
          title="Couldn&apos;t load dashboard"
          description="Start by adding a customer and creating your first invoice."
          action={
            <div className="flex gap-2">
              <Button asChild size="sm" variant="outline"><Link href="/customers/new">Add customer</Link></Button>
              <Button asChild size="sm"><Link href="/invoices/new">Create invoice</Link></Button>
            </div>
          }
        />
      </div>
    );
  }

  const chartData = data.revenueByMonth.map((r) => ({
    month: r.month.slice(5), // "2026-03" → "03"
    revenue: parseFloat(r.revenue),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Your financial operations at a glance.</p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={IndianRupee}
          label="Revenue this month"
          value={formatCurrency(data.revenue.thisMonth)}
          trend={data.revenue.changePercent}
        />
        <StatCard
          icon={Receipt}
          label="Outstanding"
          value={formatCurrency(data.outstanding)}
          sub={`${data.invoices.issued} issued + ${data.invoices.overdue} overdue`}
        />
        <StatCard
          icon={FileText}
          label="Total invoices"
          value={String(data.invoices.total)}
          sub={`${data.invoices.paid} paid · ${data.invoices.draft} draft`}
        />
        <StatCard
          icon={ShieldCheck}
          label="GST collected"
          value={formatCurrency(data.gst.total)}
          sub={`CGST ${formatCurrency(data.gst.cgst)} · IGST ${formatCurrency(data.gst.igst)}`}
        />
      </div>

      {/* Chart + recent invoices */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Revenue (last 6 months)</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <EmptyState
                icon={IndianRupee}
                title="No revenue data yet"
                description="Issue your first invoice to see revenue trends."
                className="border-none py-8"
              />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-hairline)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--slate)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--slate)" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(val) => [formatCurrency(Number(val ?? 0)), "Revenue"]}
                    contentStyle={{ background: "var(--paper-raised)", border: "1px solid var(--border-hairline)", borderRadius: "6px", fontSize: "12px" }}
                  />
                  <Bar dataKey="revenue" fill="var(--verdigris)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm">Recent invoices</CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-xs">
              <Link href="/invoices">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {data.recentInvoices.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No invoices yet"
                description="Create your first invoice to get started."
                action={<Button asChild size="sm"><Link href="/invoices/new">New invoice</Link></Button>}
                className="border-none px-0 py-4"
              />
            ) : (
              <div className="space-y-3">
                {data.recentInvoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between gap-2 text-sm">
                    <div className="min-w-0">
                      <Link href={`/invoices/${inv.id}`} className="figure-numeric font-medium hover:text-primary truncate block">
                        {inv.invoiceNumber}
                      </Link>
                      <p className="truncate text-xs text-muted-foreground">{inv.customerName}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <StatusBadge status={inv.status} />
                      <p className="figure-numeric mt-0.5 text-xs text-muted-foreground">{formatCurrency(inv.grandTotal)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* GST breakdown + quick actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="sm:col-span-2">
          <CardHeader><CardTitle className="text-sm">GST breakdown</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-3 gap-4 text-center">
            {[
              { label: "CGST", value: data.gst.cgst },
              { label: "SGST", value: data.gst.sgst },
              { label: "IGST", value: data.gst.igst },
            ].map((g) => (
              <div key={g.label}>
                <p className="text-xs text-muted-foreground">{g.label}</p>
                <p className="figure-numeric mt-0.5 text-base font-semibold">{formatCurrency(g.value)}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="sm:col-span-2">
          <CardHeader><CardTitle className="text-sm">Quick actions</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" asChild className="justify-start text-xs">
              <Link href="/invoices/new"><FileText className="mr-1.5 size-3.5" />New invoice</Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="justify-start text-xs">
              <Link href="/customers/new"><Receipt className="mr-1.5 size-3.5" />Add customer</Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="justify-start text-xs">
              <Link href="/payments"><IndianRupee className="mr-1.5 size-3.5" />Record payment</Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="justify-start text-xs">
              <Link href="/reconciliation"><ShieldCheck className="mr-1.5 size-3.5" />Run GST check</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
