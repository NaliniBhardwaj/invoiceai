import { prisma } from "@/shared/prisma/client";
import { eventBus } from "@/shared/events/event-bus";
import { EventTypes } from "@/shared/events/domain-event";
import { ApiError } from "@/shared/utils/api-error";
import { buildPaginationMeta, toSkipTake, type PaginatedResult } from "@/shared/utils/pagination";
import type {
  CreatePurchaseOrderInput,
  PurchaseOrderQuery,
  UpdatePurchaseOrderInput,
} from "@/features/purchase-orders/purchase-order.schema";

export interface PurchaseOrderDTO {
  id: string;
  poNumber: string;
  status: string;
  customerId: string;
  customerName: string;
  customerGstNumber: string | null;
  invoiceCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface PoRow {
  id: string;
  poNumber: string;
  status: string;
  customerId: string;
  createdAt: Date;
  updatedAt: Date;
  customer: { name: string; gstNumber: string | null };
  _count: { invoices: number };
}

interface PoBase {
  id: string;
  poNumber: string;
  status: string;
  customerId: string;
  createdAt: Date;
  updatedAt: Date;
}

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  OPEN: ["PARTIALLY_INVOICED", "CLOSED", "CANCELLED"],
  PARTIALLY_INVOICED: ["CLOSED", "CANCELLED"],
  CLOSED: [],
  CANCELLED: [],
};

class PurchaseOrderService {
  async create(
    organizationId: string,
    actorId: string,
    input: CreatePurchaseOrderInput
  ): Promise<PurchaseOrderDTO> {
    const customer = await prisma.customer.findFirst({
      where: { id: input.customerId, organizationId, deletedAt: null },
    });
    if (!customer) throw ApiError.notFound("Customer not found");

    let poNumber = input.poNumber;
    if (!poNumber) {
      poNumber = await this.generatePoNumber(organizationId);
    } else {
      const existing = await prisma.purchaseOrder.findFirst({
        where: { organizationId, poNumber, deletedAt: null },
      });
      if (existing) throw ApiError.conflict(`PO number ${poNumber} already exists`);
    }

    const po = await prisma.purchaseOrder.create({
      data: { organizationId, customerId: input.customerId, poNumber, status: "OPEN" },
      include: { customer: true, _count: { select: { invoices: true } } },
    });

    await eventBus.emit(
      EventTypes.PURCHASE_ORDER_CREATED,
      organizationId,
      { entityType: "PurchaseOrder", entityId: po.id, poNumber },
      actorId
    );

    return this.toDTO(po as PoRow);
  }

  async update(
    organizationId: string,
    actorId: string,
    poId: string,
    input: UpdatePurchaseOrderInput
  ): Promise<PurchaseOrderDTO> {
    const po = await this.findOrThrow(organizationId, poId);

    if (input.status && input.status !== po.status) {
      const allowed = ALLOWED_TRANSITIONS[po.status] ?? [];
      if (!allowed.includes(input.status)) {
        throw ApiError.badRequest(
          `Cannot transition a ${po.status} purchase order to ${input.status}`
        );
      }
    }

    const updated = await prisma.purchaseOrder.update({
      where: { id: poId },
      data: { status: input.status },
      include: { customer: true, _count: { select: { invoices: true } } },
    });

    const eventType =
      input.status === "CLOSED"
        ? EventTypes.PURCHASE_ORDER_CLOSED
        : input.status === "CANCELLED"
          ? EventTypes.PURCHASE_ORDER_CANCELLED
          : EventTypes.PURCHASE_ORDER_UPDATED;

    await eventBus.emit(
      eventType,
      organizationId,
      { entityType: "PurchaseOrder", entityId: poId, newStatus: input.status },
      actorId
    );

    return this.toDTO(updated as PoRow);
  }

  async softDelete(organizationId: string, actorId: string, poId: string): Promise<void> {
    const po = await this.findOrThrow(organizationId, poId);
    if (!["CANCELLED", "CLOSED"].includes(po.status)) {
      throw ApiError.conflict("Only CLOSED or CANCELLED purchase orders can be deleted");
    }
    await prisma.purchaseOrder.update({ where: { id: poId }, data: { deletedAt: new Date() } });
    await eventBus.emit(
      EventTypes.PURCHASE_ORDER_CANCELLED,
      organizationId,
      { entityType: "PurchaseOrder", entityId: poId },
      actorId
    );
  }

  async getById(organizationId: string, poId: string): Promise<PurchaseOrderDTO> {
    const po = await prisma.purchaseOrder.findFirst({
      where: { id: poId, organizationId, deletedAt: null },
      include: { customer: true, _count: { select: { invoices: true } } },
    });
    if (!po) throw ApiError.notFound("Purchase order not found");
    return this.toDTO(po as PoRow);
  }

  async list(
    organizationId: string,
    query: PurchaseOrderQuery
  ): Promise<PaginatedResult<PurchaseOrderDTO>> {
    const where = {
      organizationId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.customerId ? { customerId: query.customerId } : {}),
      ...(query.search
        ? {
            OR: [
              { poNumber: { contains: query.search } },
              { customer: { name: { contains: query.search } } },
            ],
          }
        : {}),
    };

    const { skip, take } = toSkipTake(query);
    const [pos, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: query.sortOrder },
        include: { customer: true, _count: { select: { invoices: true } } },
      }),
      prisma.purchaseOrder.count({ where }),
    ]);

    return {
      data: (pos as PoRow[]).map((p) => this.toDTO(p)),
      meta: buildPaginationMeta(total as number, query.page, query.limit),
    };
  }

  async syncStatusFromInvoice(organizationId: string, poId: string): Promise<void> {
    const po = await prisma.purchaseOrder.findFirst({
      where: { id: poId, organizationId, deletedAt: null },
      include: { invoices: { where: { deletedAt: null } } },
    });
    if (!po || po.status === "CLOSED" || po.status === "CANCELLED") return;

    const poAny = po as PoBase & { invoices: unknown[] };
    const hasInvoices = poAny.invoices.length > 0;
    const newStatus = hasInvoices ? "PARTIALLY_INVOICED" : "OPEN";

    if (newStatus !== po.status) {
      await prisma.purchaseOrder.update({ where: { id: poId }, data: { status: newStatus } });
    }
  }

  private async generatePoNumber(organizationId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.purchaseOrder.count({
      where: { organizationId, poNumber: { startsWith: `PO-${year}-` } },
    });
    return `PO-${year}-${String((count as number) + 1).padStart(4, "0")}`;
  }

  private async findOrThrow(organizationId: string, poId: string): Promise<PoBase> {
    const po = await prisma.purchaseOrder.findFirst({
      where: { id: poId, organizationId, deletedAt: null },
    });
    if (!po) throw ApiError.notFound("Purchase order not found");
    return po as PoBase;
  }

  private toDTO(po: PoRow): PurchaseOrderDTO {
    return {
      id: po.id,
      poNumber: po.poNumber,
      status: po.status,
      customerId: po.customerId,
      customerName: po.customer.name,
      customerGstNumber: po.customer.gstNumber,
      invoiceCount: po._count.invoices,
      createdAt: po.createdAt,
      updatedAt: po.updatedAt,
    };
  }
}

export const purchaseOrderService = new PurchaseOrderService();
