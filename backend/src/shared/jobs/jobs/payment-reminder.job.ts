import { prisma } from "@/shared/prisma/client";
import { eventBus } from "@/shared/events/event-bus";
import { EventTypes } from "@/shared/events/domain-event";
import type { Job, JobResult } from "@/shared/jobs/job.types";

interface OverdueInvoiceRow {
  id: string;
  organizationId: string;
  invoiceNumber: string;
  grandTotal: { toString(): string };
}

/**
 * Daily job that marks ISSUED invoices past their due date as OVERDUE.
 * This is the only place where OVERDUE status is set — the invoice
 * service itself only transitions to PAID/PARTIALLY_PAID. The job
 * emits INVOICE_OVERDUE for each affected invoice, which will be the
 * trigger for email reminders once a NotificationService exists.
 */
export const paymentReminderJob: Job = {
  name: "payment-reminder",
  cronExpression: "0 9 * * *", // daily at 09:00
  enabled: true,
  handler: async (): Promise<JobResult> => {
    const now = new Date();

    // Find all ISSUED invoices past their due date
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        status: "ISSUED",
        dueDate: { lt: now },
        deletedAt: null,
      },
      select: { id: true, organizationId: true, invoiceNumber: true, grandTotal: true },
    });

    if (overdueInvoices.length === 0) {
      return { success: true, summary: "No overdue invoices found" };
    }

    const rows = overdueInvoices as OverdueInvoiceRow[];

    // Bulk update to OVERDUE
    await prisma.invoice.updateMany({
      where: { id: { in: rows.map((inv) => inv.id) } },
      data: { status: "OVERDUE" },
    });

    // Emit one event per invoice so audit logging and future notification
    // handlers can react to each one individually
    for (const inv of rows) {
      await eventBus.emit(
        EventTypes.INVOICE_OVERDUE,
        inv.organizationId,
        {
          entityType: "Invoice",
          entityId: inv.id,
          invoiceNumber: inv.invoiceNumber,
          grandTotal: inv.grandTotal.toString(),
        },
        null
      );
    }

    return {
      success: true,
      summary: `Marked ${overdueInvoices.length} invoice(s) as OVERDUE`,
      data: { count: overdueInvoices.length },
    };
  },
};
