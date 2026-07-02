import { prisma } from "@/shared/prisma/client";
import { eventBus } from "@/shared/events/event-bus";
import { EventTypes } from "@/shared/events/domain-event";
import { ApiError } from "@/shared/utils/api-error";
import {
  buildPaginationMeta,
  toSkipTake,
  type PaginatedResult,
} from "@/shared/utils/pagination";
import type {
  CreateCustomerInput,
  CustomerQuery,
  UpdateCustomerInput,
} from "@/features/customers/customer.schema";
import type {
  CustomerAnalyticsDTO,
  CustomerDTO,
  CustomerHistoryDTO,
} from "@/features/customers/customer.types";

// Local row shapes so we never depend on Prisma's generated namespace types
// (which require the query-engine binary to be generated first).
interface CustomerRow {
  id: string;
  name: string;
  companyName: string | null;
  gstNumber: string | null;
  billingAddress: string;
  state: string;
  email: string | null;
  phone: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface InvoiceHistoryRow {
  id: string;
  invoiceNumber: string;
  status: string;
  grandTotal: { toString(): string };
  invoiceDate: Date;
  dueDate: Date;
}

interface PaymentHistoryRow {
  id: string;
  amount: { toString(): string };
  paidAt: Date;
  invoice: { invoiceNumber: string };
}

interface GroupByStateRow {
  state: string;
  _count: { _all: number };
}

interface StateCount {
  state: string;
  count: number;
}

class CustomerService {
  async create(
    organizationId: string,
    actorId: string,
    input: CreateCustomerInput
  ): Promise<CustomerDTO> {
    if (input.gstNumber) {
      const existing = await prisma.customer.findFirst({
        where: { organizationId, gstNumber: input.gstNumber, deletedAt: null },
      });
      if (existing) {
        throw ApiError.conflict("A customer with this GST number already exists");
      }
    }

    const customer = await prisma.customer.create({
      data: {
        organizationId,
        name: input.name,
        companyName: input.companyName || null,
        gstNumber: input.gstNumber || null,
        billingAddress: input.billingAddress,
        state: input.state,
        email: input.email || null,
        phone: input.phone || null,
      },
    });

    await eventBus.emit(
      EventTypes.CUSTOMER_CREATED,
      organizationId,
      { entityType: "Customer", entityId: customer.id, name: customer.name },
      actorId
    );

    return this.toDTO(customer as CustomerRow);
  }

  async update(
    organizationId: string,
    actorId: string,
    customerId: string,
    input: UpdateCustomerInput
  ): Promise<CustomerDTO> {
    const existing = await this.findOrThrow(organizationId, customerId);

    if (input.gstNumber && input.gstNumber !== existing.gstNumber) {
      const duplicate = await prisma.customer.findFirst({
        where: {
          organizationId,
          gstNumber: input.gstNumber,
          deletedAt: null,
          NOT: { id: customerId },
        },
      });
      if (duplicate) {
        throw ApiError.conflict("A customer with this GST number already exists");
      }
    }

    const customer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        name: input.name,
        companyName: input.companyName,
        gstNumber: input.gstNumber,
        billingAddress: input.billingAddress,
        state: input.state,
        email: input.email,
        phone: input.phone,
      },
    });

    await eventBus.emit(
      EventTypes.CUSTOMER_UPDATED,
      organizationId,
      { entityType: "Customer", entityId: customer.id, changes: input as Record<string, unknown> },
      actorId
    );

    return this.toDTO(customer as CustomerRow);
  }

  async softDelete(organizationId: string, actorId: string, customerId: string): Promise<void> {
    await this.findOrThrow(organizationId, customerId);

    const [openInvoiceCount, openPoCount] = await Promise.all([
      prisma.invoice.count({
        where: {
          customerId,
          deletedAt: null,
          status: { notIn: ["PAID", "CANCELLED"] },
        },
      }),
      prisma.purchaseOrder.count({
        where: { customerId, deletedAt: null, status: { notIn: ["CLOSED", "CANCELLED"] } },
      }),
    ]);

    if (openInvoiceCount > 0 || openPoCount > 0) {
      throw ApiError.conflict(
        "Cannot delete a customer with open invoices or purchase orders — close or cancel them first",
        { openInvoiceCount, openPoCount }
      );
    }

    await prisma.customer.update({
      where: { id: customerId },
      data: { deletedAt: new Date() },
    });

    await eventBus.emit(
      EventTypes.CUSTOMER_DELETED,
      organizationId,
      { entityType: "Customer", entityId: customerId },
      actorId
    );
  }

  async getById(organizationId: string, customerId: string): Promise<CustomerDTO> {
    const customer = await this.findOrThrow(organizationId, customerId);
    return this.toDTO(customer);
  }

  async list(
    organizationId: string,
    query: CustomerQuery
  ): Promise<PaginatedResult<CustomerDTO>> {
    // No Prisma.CustomerWhereInput — inferred from the object literal
    const where = {
      organizationId,
      deletedAt: null,
      ...(query.state ? { state: query.state } : {}),
      ...(query.hasGstNumber !== undefined
        ? { gstNumber: query.hasGstNumber ? { not: null } : null }
        : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search } },
              { companyName: { contains: query.search } },
              { gstNumber: { contains: query.search } },
              { email: { contains: query.search } },
            ],
          }
        : {}),
    };

    const { skip, take } = toSkipTake(query);
    const orderBy = query.sortBy
      ? { [query.sortBy]: query.sortOrder }
      : { createdAt: query.sortOrder };

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({ where, skip, take, orderBy }),
      prisma.customer.count({ where }),
    ]);

    return {
      data: (customers as CustomerRow[]).map((c) => this.toDTO(c)),
      meta: buildPaginationMeta(total as number, query.page, query.limit),
    };
  }

  async getHistory(organizationId: string, customerId: string): Promise<CustomerHistoryDTO> {
    await this.findOrThrow(organizationId, customerId);

    const [purchaseOrders, invoices, payments] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where: { customerId, organizationId, deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { id: true, poNumber: true, status: true, createdAt: true },
      }),
      prisma.invoice.findMany({
        where: { customerId, organizationId, deletedAt: null },
        orderBy: { invoiceDate: "desc" },
        take: 20,
        select: {
          id: true,
          invoiceNumber: true,
          status: true,
          grandTotal: true,
          invoiceDate: true,
          dueDate: true,
        },
      }),
      prisma.payment.findMany({
        where: { organizationId, invoice: { customerId }, deletedAt: null },
        orderBy: { paidAt: "desc" },
        take: 20,
        select: {
          id: true,
          amount: true,
          paidAt: true,
          invoice: { select: { invoiceNumber: true } },
        },
      }),
    ]);

    return {
      purchaseOrders: purchaseOrders as Array<{ id: string; poNumber: string; status: string; createdAt: Date }>,
      invoices: (invoices as InvoiceHistoryRow[]).map((inv) => ({
        ...inv,
        grandTotal: inv.grandTotal.toString(),
      })),
      payments: (payments as PaymentHistoryRow[]).map((p) => ({
        id: p.id,
        amount: p.amount.toString(),
        paidAt: p.paidAt,
        invoiceNumber: p.invoice.invoiceNumber,
      })),
    };
  }

  async getAnalytics(organizationId: string): Promise<CustomerAnalyticsDTO> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalCustomers, customersWithGstNumber, byStateRaw, addedLast30Days] =
      await Promise.all([
        prisma.customer.count({ where: { organizationId, deletedAt: null } }),
        prisma.customer.count({
          where: { organizationId, deletedAt: null, gstNumber: { not: null } },
        }),
        prisma.customer.groupBy({
          by: ["state"],
          where: { organizationId, deletedAt: null },
          _count: { _all: true },
        }),
        prisma.customer.count({
          where: { organizationId, deletedAt: null, createdAt: { gte: thirtyDaysAgo } },
        }),
      ]);

    return {
      totalCustomers: totalCustomers as number,
      customersWithGstNumber: customersWithGstNumber as number,
      byState: (byStateRaw as GroupByStateRow[])
        .map((row): StateCount => ({ state: row.state, count: row._count._all }))
        .sort((a: StateCount, b: StateCount) => b.count - a.count),
      addedLast30Days: addedLast30Days as number,
    };
  }

  async assertBelongsToOrg(organizationId: string, customerId: string): Promise<void> {
    await this.findOrThrow(organizationId, customerId);
  }

  private async findOrThrow(organizationId: string, customerId: string): Promise<CustomerRow> {
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, organizationId, deletedAt: null },
    });
    if (!customer) {
      throw ApiError.notFound("Customer not found");
    }
    return customer as CustomerRow;
  }

  private toDTO(customer: CustomerRow): CustomerDTO {
    return {
      id: customer.id,
      name: customer.name,
      companyName: customer.companyName,
      gstNumber: customer.gstNumber,
      billingAddress: customer.billingAddress,
      state: customer.state,
      email: customer.email,
      phone: customer.phone,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };
  }
}

export const customerService = new CustomerService();
