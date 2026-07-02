import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/shared/prisma/client";
import { eventBus } from "@/shared/events/event-bus";
import { EventTypes } from "@/shared/events/domain-event";
import { ApiError } from "@/shared/utils/api-error";
import { buildPaginationMeta, toSkipTake, type PaginatedResult } from "@/shared/utils/pagination";
import { invoiceService } from "@/features/invoices/invoice.service";
import type { PaymentQuery, RecordPaymentInput } from "@/features/payments/payment.schema";
import type { PaymentDTO } from "@/features/payments/payment.types";

interface ExistingPaymentRow {
  amount: Decimal;
}

interface PaymentRow {
  id: string;
  invoiceId: string;
  amount: Decimal;
  paidAt: Date;
  method: string | null;
  reference: string | null;
  createdAt: Date;
  invoice: { invoiceNumber: string; customer: { name: string } };
}

interface InvoiceWithPayments {
  id: string;
  status: string;
  grandTotal: Decimal;
  payments: ExistingPaymentRow[];
}

class PaymentService {
  async record(
    organizationId: string,
    actorId: string,
    input: RecordPaymentInput
  ): Promise<PaymentDTO> {
    const invoice = await prisma.invoice.findFirst({
      where: { id: input.invoiceId, organizationId, deletedAt: null },
      include: { payments: { where: { deletedAt: null } } },
    });
    if (!invoice) throw ApiError.notFound("Invoice not found");

    const inv = invoice as InvoiceWithPayments;

    if (inv.status === "CANCELLED") {
      throw ApiError.badRequest("Cannot record payment against a cancelled invoice");
    }
    if (inv.status === "PAID") {
      throw ApiError.badRequest("This invoice is already fully paid");
    }

    const totalAlreadyPaid = inv.payments.reduce(
      (sum: Decimal, p: ExistingPaymentRow) => sum.plus(p.amount),
      new Decimal(0)
    );
    const remaining = new Decimal(inv.grandTotal).minus(totalAlreadyPaid);
    const paymentAmount = new Decimal(input.amount);

    if (paymentAmount.greaterThan(remaining)) {
      throw ApiError.badRequest(
        `Payment of ₹${paymentAmount} exceeds remaining balance of ₹${remaining.toDecimalPlaces(2)}`,
        { remaining: remaining.toDecimalPlaces(2).toString() }
      );
    }

    const payment = await prisma.payment.create({
      data: {
        organizationId,
        invoiceId: input.invoiceId,
        amount: paymentAmount,
        paidAt: input.paidAt,
        method: input.method ?? null,
        reference: input.reference ?? null,
      },
      include: { invoice: { include: { customer: true } } },
    });

    await invoiceService.updateStatusFromPayment(organizationId, input.invoiceId, actorId);

    await eventBus.emit(
      EventTypes.PAYMENT_RECORDED,
      organizationId,
      {
        entityType: "Payment",
        entityId: payment.id,
        invoiceId: input.invoiceId,
        amount: paymentAmount.toString(),
      },
      actorId
    );

    return this.toDTO(payment as PaymentRow);
  }

  async refund(organizationId: string, actorId: string, paymentId: string): Promise<void> {
    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, organizationId, deletedAt: null },
    });
    if (!payment) throw ApiError.notFound("Payment not found");

    const p = payment as { id: string; invoiceId: string };
    await prisma.payment.update({ where: { id: paymentId }, data: { deletedAt: new Date() } });
    await invoiceService.updateStatusFromPayment(organizationId, p.invoiceId, actorId);

    await eventBus.emit(
      EventTypes.PAYMENT_REFUNDED,
      organizationId,
      { entityType: "Payment", entityId: paymentId, invoiceId: p.invoiceId },
      actorId
    );
  }

  async list(
    organizationId: string,
    query: PaymentQuery
  ): Promise<PaginatedResult<PaymentDTO>> {
    const where = {
      organizationId,
      deletedAt: null,
      ...(query.invoiceId ? { invoiceId: query.invoiceId } : {}),
      ...(query.fromDate || query.toDate
        ? {
            paidAt: {
              ...(query.fromDate ? { gte: query.fromDate } : {}),
              ...(query.toDate ? { lte: query.toDate } : {}),
            },
          }
        : {}),
      ...(query.search
        ? {
            OR: [
              { reference: { contains: query.search } },
              { invoice: { invoiceNumber: { contains: query.search } } },
              { invoice: { customer: { name: { contains: query.search } } } },
            ],
          }
        : {}),
    };

    const { skip, take } = toSkipTake(query);
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take,
        orderBy: { paidAt: query.sortOrder },
        include: { invoice: { include: { customer: true } } },
      }),
      prisma.payment.count({ where }),
    ]);

    return {
      data: (payments as PaymentRow[]).map((p: PaymentRow) => this.toDTO(p)),
      meta: buildPaginationMeta(total as number, query.page, query.limit),
    };
  }

  private toDTO(payment: PaymentRow): PaymentDTO {
    return {
      id: payment.id,
      invoiceId: payment.invoiceId,
      invoiceNumber: payment.invoice.invoiceNumber,
      customerName: payment.invoice.customer.name,
      amount: payment.amount.toString(),
      paidAt: payment.paidAt,
      method: payment.method,
      reference: payment.reference,
      createdAt: payment.createdAt,
    };
  }
}

export const paymentService = new PaymentService();
