import { Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/shared/prisma/client";
import { eventBus } from "@/shared/events/event-bus";
import { EventTypes } from "@/shared/events/domain-event";
import { ApiError } from "@/shared/utils/api-error";
import { buildPaginationMeta, toSkipTake, type PaginatedResult } from "@/shared/utils/pagination";
import { calculateLineTotal, calculateTax } from "@/features/tax/tax-engine";
import { purchaseOrderService } from "@/features/purchase-orders/purchase-order.service";
import type { CreateInvoiceInput, InvoiceQuery, UpdateInvoiceInput } from "@/features/invoices/invoice.schema";
import type { InvoiceAnalyticsDTO, InvoiceDTO, LineItemDTO } from "@/features/invoices/invoice.types";

// Local shape definitions — avoids dependency on Prisma's generated
// namespace types which require the query-engine binary to be present.
interface GroupByStatusRow {
  status: string;
  _count: { _all: number };
  _sum: { grandTotal: Decimal | null };
}

interface GroupByTypeRow {
  type: string;
  _count: { _all: number };
}

interface RevenueMonthRow {
  month: string;
  revenue: string;
}

interface PaymentRow {
  amount: Decimal;
}

// Full row shape returned by findMany with includeShape() — extracted from
// toDTO's parameter type so the .map() callback can be typed without 'any'.
interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  type: string;
  status: string;
  customerId: string;
  purchaseOrderId: string | null;
  subscriptionPlan: string | null;
  subscriptionDuration: number | null;
  invoiceDate: Date;
  dueDate: Date;
  subtotal: Decimal;
  taxPercentage: Decimal;
  cgst: Decimal;
  sgst: Decimal;
  igst: Decimal;
  grandTotal: Decimal;
  pdfUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  customer: {
    name: string;
    companyName: string | null;
    gstNumber: string | null;
    billingAddress: string;
    state: string;
  };
  purchaseOrder: { poNumber: string } | null;
  lineItems: Array<{
    id: string;
    description: string;
    quantity: Decimal;
    unitPrice: Decimal;
    lineTotal: Decimal;
  }>;
}

class InvoiceService {
  async create(
    organizationId: string,
    actorId: string,
    input: CreateInvoiceInput
  ): Promise<InvoiceDTO> {
    const [org, customer] = await Promise.all([
      prisma.organization.findUniqueOrThrow({ where: { id: organizationId } }),
      prisma.customer.findFirst({ where: { id: input.customerId, organizationId, deletedAt: null } }),
    ]);
    if (!customer) throw ApiError.notFound("Customer not found");

    if (input.purchaseOrderId) {
      const po = await prisma.purchaseOrder.findFirst({
        where: { id: input.purchaseOrderId, organizationId, deletedAt: null },
      });
      if (!po) throw ApiError.notFound("Purchase order not found");
      if (po.status === "CLOSED" || po.status === "CANCELLED") {
        throw ApiError.badRequest("Cannot create invoice against a closed or cancelled PO");
      }
    }

    // ── Tax calculation via the engine ──────────────────────────────────
    const lineItemAmounts = input.lineItems.map((li) => ({
      ...li,
      lineTotal: calculateLineTotal(li),
    }));
    const subtotal = lineItemAmounts.reduce((sum, li) => sum.plus(li.lineTotal), new Decimal(0));
    const tax = calculateTax(subtotal, input.taxPercentage, org.state, customer.state);
    const invoiceNumber = await this.generateInvoiceNumber(organizationId);

    const invoice = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const inv = await tx.invoice.create({
        data: {
          organizationId,
          customerId: input.customerId,
          purchaseOrderId: input.purchaseOrderId ?? null,
          invoiceNumber,
          type: input.type,
          status: "DRAFT",
          subscriptionPlan: input.subscriptionPlan ?? null,
          subscriptionDuration: input.subscriptionDuration ?? null,
          invoiceDate: input.invoiceDate,
          dueDate: input.dueDate,
          subtotal: tax.subtotal,
          taxPercentage: tax.taxPercentage,
          cgst: tax.cgst,
          sgst: tax.sgst,
          igst: tax.igst,
          grandTotal: tax.grandTotal,
          lineItems: {
            create: lineItemAmounts.map((li) => ({
              description: li.description,
              quantity: new Decimal(li.quantity),
              unitPrice: new Decimal(li.unitPrice),
              lineTotal: li.lineTotal.toDecimalPlaces(2),
            })),
          },
        },
        include: this.includeShape(),
      });
      return inv;
    });

    if (input.purchaseOrderId) {
      await purchaseOrderService.syncStatusFromInvoice(organizationId, input.purchaseOrderId);
    }

    await eventBus.emit(
      EventTypes.INVOICE_CREATED,
      organizationId,
      { entityType: "Invoice", entityId: invoice.id, invoiceNumber, grandTotal: tax.grandTotal.toString() },
      actorId
    );

    return this.toDTO(invoice as InvoiceRow, tax.isIntraState);
  }

  async update(
    organizationId: string,
    actorId: string,
    invoiceId: string,
    input: UpdateInvoiceInput
  ): Promise<InvoiceDTO> {
    const existing = await this.findOrThrow(organizationId, invoiceId);
    if (existing.status !== "DRAFT") {
      throw ApiError.badRequest("Only DRAFT invoices can be edited");
    }

    const [org, customer] = await Promise.all([
      prisma.organization.findUniqueOrThrow({ where: { id: organizationId } }),
      prisma.customer.findUniqueOrThrow({ where: { id: existing.customerId } }),
    ]);

    let subtotal = new Decimal(existing.subtotal);
    let tax = calculateTax(subtotal, existing.taxPercentage, org.state, customer.state);

    const invoice = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      if (input.lineItems) {
        const lineItemAmounts = input.lineItems.map((li) => ({
          ...li,
          lineTotal: calculateLineTotal(li),
        }));
        subtotal = lineItemAmounts.reduce((sum, li) => sum.plus(li.lineTotal), new Decimal(0));
        tax = calculateTax(
          subtotal,
          input.taxPercentage ?? Number(existing.taxPercentage),
          org.state,
          customer.state
        );

        await tx.invoiceLineItem.deleteMany({ where: { invoiceId } });
        await tx.invoiceLineItem.createMany({
          data: lineItemAmounts.map((li) => ({
            invoiceId,
            description: li.description,
            quantity: new Decimal(li.quantity),
            unitPrice: new Decimal(li.unitPrice),
            lineTotal: li.lineTotal.toDecimalPlaces(2),
          })),
        });
      }

      return tx.invoice.update({
        where: { id: invoiceId },
        data: {
          purchaseOrderId: input.purchaseOrderId ?? undefined,
          subscriptionPlan: input.subscriptionPlan,
          subscriptionDuration: input.subscriptionDuration,
          invoiceDate: input.invoiceDate,
          dueDate: input.dueDate,
          taxPercentage: input.taxPercentage ? new Decimal(input.taxPercentage) : undefined,
          subtotal: tax.subtotal,
          cgst: tax.cgst,
          sgst: tax.sgst,
          igst: tax.igst,
          grandTotal: tax.grandTotal,
        },
        include: this.includeShape(),
      });
    });

    await eventBus.emit(
      EventTypes.INVOICE_UPDATED,
      organizationId,
      { entityType: "Invoice", entityId: invoiceId },
      actorId
    );

    return this.toDTO(invoice as InvoiceRow, tax.isIntraState);
  }

  async issue(organizationId: string, actorId: string, invoiceId: string): Promise<InvoiceDTO> {
    const existing = await this.findOrThrow(organizationId, invoiceId);
    if (existing.status !== "DRAFT") {
      throw ApiError.badRequest("Only DRAFT invoices can be issued");
    }

    const invoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: "ISSUED" },
      include: this.includeShape(),
    });

    await eventBus.emit(
      EventTypes.INVOICE_ISSUED,
      organizationId,
      { entityType: "Invoice", entityId: invoiceId, invoiceNumber: invoice.invoiceNumber },
      actorId
    );

    return this.toDTO(invoice as InvoiceRow, this.computeIsIntraState(invoice as InvoiceRow));
  }

  async cancel(organizationId: string, actorId: string, invoiceId: string): Promise<InvoiceDTO> {
    const existing = await this.findOrThrow(organizationId, invoiceId);
    if (existing.status === "PAID" || existing.status === "CANCELLED") {
      throw ApiError.badRequest(`Cannot cancel a ${existing.status} invoice`);
    }

    const invoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: "CANCELLED" },
      include: this.includeShape(),
    });

    await eventBus.emit(
      EventTypes.INVOICE_CANCELLED,
      organizationId,
      { entityType: "Invoice", entityId: invoiceId },
      actorId
    );

    return this.toDTO(invoice as InvoiceRow, this.computeIsIntraState(invoice as InvoiceRow));
  }

  async softDelete(organizationId: string, actorId: string, invoiceId: string): Promise<void> {
    const existing = await this.findOrThrow(organizationId, invoiceId);
    if (!["DRAFT", "CANCELLED"].includes(existing.status)) {
      throw ApiError.badRequest("Only DRAFT or CANCELLED invoices can be deleted");
    }
    await prisma.invoice.update({ where: { id: invoiceId }, data: { deletedAt: new Date() } });
    await eventBus.emit(
      EventTypes.INVOICE_DELETED,
      organizationId,
      { entityType: "Invoice", entityId: invoiceId },
      actorId
    );
  }

  async getById(organizationId: string, invoiceId: string): Promise<InvoiceDTO> {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, organizationId, deletedAt: null },
      include: this.includeShape(),
    });
    if (!invoice) throw ApiError.notFound("Invoice not found");
    const row = invoice as InvoiceRow;
    return this.toDTO(row, this.computeIsIntraState(row));
  }

  async list(organizationId: string, query: InvoiceQuery): Promise<PaginatedResult<InvoiceDTO>> {
    const where = {
      organizationId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.customerId ? { customerId: query.customerId } : {}),
      ...(query.fromDate || query.toDate
        ? {
            invoiceDate: {
              ...(query.fromDate ? { gte: query.fromDate } : {}),
              ...(query.toDate ? { lte: query.toDate } : {}),
            },
          }
        : {}),
      ...(query.search
        ? {
            OR: [
              { invoiceNumber: { contains: query.search } },
              { customer: { name: { contains: query.search } } },
              { customer: { companyName: { contains: query.search } } },
            ],
          }
        : {}),
    };

    const { skip, take } = toSkipTake(query);
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take,
        orderBy: { invoiceDate: query.sortOrder },
        include: this.includeShape(),
      }),
      prisma.invoice.count({ where }),
    ]);

    return {
      data: (invoices as InvoiceRow[]).map((inv: InvoiceRow) =>
        this.toDTO(inv, this.computeIsIntraState(inv))
      ),
      meta: buildPaginationMeta(total as number, query.page, query.limit),
    };
  }

  async getAnalytics(organizationId: string): Promise<InvoiceAnalyticsDTO> {
    const [totalInvoices, byStatusRaw, byTypeRaw, revenueRaw] = await Promise.all([
      prisma.invoice.count({ where: { organizationId, deletedAt: null } }),
      prisma.invoice.groupBy({
        by: ["status"],
        where: { organizationId, deletedAt: null },
        _count: { _all: true },
        _sum: { grandTotal: true },
      }),
      prisma.invoice.groupBy({
        by: ["type"],
        where: { organizationId, deletedAt: null },
        _count: { _all: true },
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
        LIMIT 12
      `,
    ]);

    const byStatus = (byStatusRaw as GroupByStatusRow[]).map((row: GroupByStatusRow) => ({
      status: row.status,
      count: row._count._all,
      total: (row._sum.grandTotal ?? new Decimal(0)).toString(),
    }));

    const totalRevenue = (byStatusRaw as GroupByStatusRow[])
      .filter((r: GroupByStatusRow) => ["ISSUED", "PAID", "PARTIALLY_PAID"].includes(r.status))
      .reduce((sum: Decimal, r: GroupByStatusRow) => sum.plus(r._sum.grandTotal ?? 0), new Decimal(0));

    const paid = (byStatusRaw as GroupByStatusRow[]).find((r: GroupByStatusRow) => r.status === "PAID")?._sum.grandTotal ?? new Decimal(0);
    const overdue = (byStatusRaw as GroupByStatusRow[]).find((r: GroupByStatusRow) => r.status === "OVERDUE")?._sum.grandTotal ?? new Decimal(0);
    const outstanding = totalRevenue.minus(new Decimal(paid));

    return {
      totalInvoices,
      totalRevenue: totalRevenue.toString(),
      outstanding: outstanding.toString(),
      paid: paid.toString(),
      overdue: overdue.toString(),
      byStatus,
      byType: (byTypeRaw as GroupByTypeRow[]).map((r: GroupByTypeRow) => ({ type: r.type, count: r._count._all })),
      revenueByMonth: revenueRaw as RevenueMonthRow[],
    };
  }

  /** Called by PaymentService after recording a payment to update invoice status. */
  async updateStatusFromPayment(
    organizationId: string,
    invoiceId: string,
    actorId: string
  ): Promise<void> {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, organizationId, deletedAt: null },
      include: { payments: { where: { deletedAt: null } } },
    });
    if (!invoice) return;

    const totalPaid = (invoice.payments as PaymentRow[]).reduce(
      (sum: Decimal, p: PaymentRow) => sum.plus(p.amount),
      new Decimal(0)
    );
    const grandTotal = new Decimal(invoice.grandTotal);
    let newStatus = invoice.status;

    if (totalPaid.greaterThanOrEqualTo(grandTotal)) {
      newStatus = "PAID";
    } else if (totalPaid.greaterThan(0)) {
      newStatus = "PARTIALLY_PAID";
    }

    if (newStatus !== invoice.status) {
      await prisma.invoice.update({ where: { id: invoiceId }, data: { status: newStatus } });

      const eventType =
        newStatus === "PAID" ? EventTypes.INVOICE_PAID : EventTypes.INVOICE_PARTIALLY_PAID;
      await eventBus.emit(
        eventType,
        organizationId,
        { entityType: "Invoice", entityId: invoiceId, totalPaid: totalPaid.toString() },
        actorId
      );
    }
  }

  async toJsonExport(organizationId: string, invoiceId: string): Promise<Record<string, unknown>> {
    const dto = await this.getById(organizationId, invoiceId);
    return {
      invoiceNumber: dto.invoiceNumber,
      invoiceDate: dto.invoiceDate,
      dueDate: dto.dueDate,
      status: dto.status,
      type: dto.type,
      customer: {
        name: dto.customerName,
        company: dto.customerCompany,
        gstNumber: dto.customerGstNumber,
        billingAddress: dto.customerBillingAddress,
        state: dto.customerState,
      },
      lineItems: dto.lineItems,
      totals: {
        subtotal: dto.subtotal,
        taxPercentage: dto.taxPercentage,
        cgst: dto.cgst,
        sgst: dto.sgst,
        igst: dto.igst,
        grandTotal: dto.grandTotal,
      },
    };
  }

  private async generateInvoiceNumber(organizationId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.invoice.count({
      where: { organizationId, invoiceNumber: { startsWith: `INV-${year}-` } },
    });
    return `INV-${year}-${String((count as number) + 1).padStart(5, "0")}`;
  }

  private includeShape() {
    return {
      customer: true,
      purchaseOrder: { select: { poNumber: true } },
      lineItems: true,
    } as const;
  }

  private computeIsIntraState(invoice: {
    cgst: Decimal | string;
  }): boolean {
    return new Decimal(invoice.cgst.toString()).greaterThan(0);
  }

  private async findOrThrow(organizationId: string, invoiceId: string) {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, organizationId, deletedAt: null },
    });
    if (!invoice) throw ApiError.notFound("Invoice not found");
    return invoice;
  }

  private toDTO(invoice: InvoiceRow, isIntraState: boolean): InvoiceDTO {
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      type: invoice.type,
      status: invoice.status,
      customerId: invoice.customerId,
      customerName: invoice.customer.name,
      customerCompany: invoice.customer.companyName,
      customerGstNumber: invoice.customer.gstNumber,
      customerBillingAddress: invoice.customer.billingAddress,
      customerState: invoice.customer.state,
      purchaseOrderId: invoice.purchaseOrderId,
      purchaseOrderNumber: invoice.purchaseOrder?.poNumber ?? null,
      subscriptionPlan: invoice.subscriptionPlan,
      subscriptionDuration: invoice.subscriptionDuration,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      subtotal: invoice.subtotal.toString(),
      taxPercentage: invoice.taxPercentage.toString(),
      cgst: invoice.cgst.toString(),
      sgst: invoice.sgst.toString(),
      igst: invoice.igst.toString(),
      grandTotal: invoice.grandTotal.toString(),
      isIntraState,
      pdfUrl: invoice.pdfUrl,
      lineItems: invoice.lineItems.map((li): LineItemDTO => ({
        id: li.id,
        description: li.description,
        quantity: li.quantity.toString(),
        unitPrice: li.unitPrice.toString(),
        lineTotal: li.lineTotal.toString(),
      })),
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    };
  }
}

export const invoiceService = new InvoiceService();
