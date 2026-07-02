import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/shared/prisma/client";

// Local row shapes for groupBy / aggregate results
interface StatusGroupRow {
  status: string;
  _count: { _all: number };
  _sum: { grandTotal: Decimal | null };
}

interface RevenueMonthRow {
  month: string;
  revenue: string;
}

interface RecentInvoiceRow {
  id: string;
  invoiceNumber: string;
  grandTotal: Decimal;
  status: string;
  dueDate: Date;
  customer: { name: string };
}

export interface DashboardSummaryDTO {
  revenue: { thisMonth: string; lastMonth: string; changePercent: number };
  outstanding: string;
  invoices: { total: number; draft: number; issued: number; overdue: number; paid: number };
  payments: { thisMonth: string; count: number };
  gst: { cgst: string; sgst: string; igst: string; total: string };
  recentInvoices: Array<{
    id: string;
    invoiceNumber: string;
    customerName: string;
    grandTotal: string;
    status: string;
    dueDate: Date;
  }>;
  revenueByMonth: Array<{ month: string; revenue: string }>;
}

class DashboardService {
  async getSummary(organizationId: string): Promise<DashboardSummaryDTO> {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [
      statusGroups,
      thisMonthRevenue,
      lastMonthRevenue,
      thisMonthPayments,
      gstTotals,
      recentInvoices,
      revenueByMonth,
    ] = await Promise.all([
      prisma.invoice.groupBy({
        by: ["status"],
        where: { organizationId, deletedAt: null },
        _count: { _all: true },
        _sum: { grandTotal: true },
      }),
      prisma.invoice.aggregate({
        where: {
          organizationId,
          deletedAt: null,
          invoiceDate: { gte: thisMonthStart },
          status: { in: ["ISSUED", "PAID", "PARTIALLY_PAID"] },
        },
        _sum: { grandTotal: true },
      }),
      prisma.invoice.aggregate({
        where: {
          organizationId,
          deletedAt: null,
          invoiceDate: { gte: lastMonthStart, lte: lastMonthEnd },
          status: { in: ["ISSUED", "PAID", "PARTIALLY_PAID"] },
        },
        _sum: { grandTotal: true },
      }),
      prisma.payment.aggregate({
        where: {
          organizationId,
          deletedAt: null,
          paidAt: { gte: thisMonthStart },
        },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      prisma.invoice.aggregate({
        where: { organizationId, deletedAt: null, status: { in: ["ISSUED", "PAID", "PARTIALLY_PAID"] } },
        _sum: { cgst: true, sgst: true, igst: true },
      }),
      prisma.invoice.findMany({
        where: { organizationId, deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          invoiceNumber: true,
          grandTotal: true,
          status: true,
          dueDate: true,
          customer: { select: { name: true } },
        },
      }),
      prisma.$queryRaw<Array<{ month: string; revenue: string }>>`
        SELECT DATE_FORMAT(invoiceDate, '%Y-%m') as month,
               CAST(SUM(grandTotal) AS CHAR) as revenue
        FROM invoices
        WHERE organizationId = ${organizationId}
          AND deletedAt IS NULL
          AND status IN ('ISSUED','PAID','PARTIALLY_PAID')
        GROUP BY month
        ORDER BY month DESC
        LIMIT 6
      `,
    ]);

    const outstanding = (statusGroups as StatusGroupRow[])
      .filter((g: StatusGroupRow) => ["ISSUED", "PARTIALLY_PAID", "OVERDUE"].includes(g.status))
      .reduce((sum: Decimal, g: StatusGroupRow) => sum.plus(g._sum.grandTotal ?? 0), new Decimal(0));

    const thisRev = new Decimal((thisMonthRevenue as { _sum: { grandTotal: Decimal | null } })._sum.grandTotal ?? 0);
    const lastRev = new Decimal((lastMonthRevenue as { _sum: { grandTotal: Decimal | null } })._sum.grandTotal ?? 0);
    const changePercent = lastRev.isZero()
      ? 0
      : thisRev.minus(lastRev).dividedBy(lastRev).times(100).toDecimalPlaces(1).toNumber();

    const countByStatus = (status: string) =>
      (statusGroups as StatusGroupRow[]).find((g: StatusGroupRow) => g.status === status)?._count._all ?? 0;

    const gstAgg = gstTotals as { _sum: { cgst: Decimal | null; sgst: Decimal | null; igst: Decimal | null } };
    const cgst = new Decimal(gstAgg._sum.cgst ?? 0);
    const sgst = new Decimal(gstAgg._sum.sgst ?? 0);
    const igst = new Decimal(gstAgg._sum.igst ?? 0);

    const paymentsAgg = thisMonthPayments as { _sum: { amount: Decimal | null }; _count: { _all: number } };

    return {
      revenue: {
        thisMonth: thisRev.toString(),
        lastMonth: lastRev.toString(),
        changePercent,
      },
      outstanding: outstanding.toString(),
      invoices: {
        total: (statusGroups as StatusGroupRow[]).reduce((sum: number, g: StatusGroupRow) => sum + g._count._all, 0),
        draft: countByStatus("DRAFT"),
        issued: countByStatus("ISSUED"),
        overdue: countByStatus("OVERDUE"),
        paid: countByStatus("PAID"),
      },
      payments: {
        thisMonth: (paymentsAgg._sum.amount ?? new Decimal(0)).toString(),
        count: paymentsAgg._count._all,
      },
      gst: {
        cgst: cgst.toString(),
        sgst: sgst.toString(),
        igst: igst.toString(),
        total: cgst.plus(sgst).plus(igst).toString(),
      },
      recentInvoices: (recentInvoices as RecentInvoiceRow[]).map((inv: RecentInvoiceRow) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        customerName: inv.customer.name,
        grandTotal: inv.grandTotal.toString(),
        status: inv.status,
        dueDate: inv.dueDate,
      })),
      revenueByMonth: (revenueByMonth as RevenueMonthRow[]).reverse(),
    };
  }
}

export const dashboardService = new DashboardService();
