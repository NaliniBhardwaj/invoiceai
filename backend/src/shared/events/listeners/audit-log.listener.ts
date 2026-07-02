import { prisma } from "@/shared/prisma/client";
import { eventBus } from "@/shared/events/event-bus";
import { EventTypes } from "@/shared/events/domain-event";
import { logger } from "@/config/logger";

/**
 * Subscribes to every event type that should leave an audit trail and
 * writes a row to AuditLog. This is the pattern every future listener
 * (NotificationListener, AIInsightListener, etc.) follows: import
 * eventBus, call .on() for the types you care about, never touch the
 * emitting service's code.
 */
const AUDITED_EVENTS = [
  EventTypes.CUSTOMER_CREATED,
  EventTypes.CUSTOMER_UPDATED,
  EventTypes.CUSTOMER_DELETED,
  EventTypes.INVOICE_CREATED,
  EventTypes.INVOICE_UPDATED,
  EventTypes.INVOICE_ISSUED,
  EventTypes.INVOICE_PAID,
  EventTypes.INVOICE_PARTIALLY_PAID,
  EventTypes.INVOICE_CANCELLED,
  EventTypes.INVOICE_DELETED,
  EventTypes.INVOICE_OVERDUE,
  EventTypes.PURCHASE_ORDER_CREATED,
  EventTypes.PURCHASE_ORDER_UPDATED,
  EventTypes.PURCHASE_ORDER_CLOSED,
  EventTypes.PURCHASE_ORDER_CANCELLED,
  EventTypes.PAYMENT_RECORDED,
  EventTypes.PAYMENT_REFUNDED,
  EventTypes.GST_SOURCE_UPLOADED,
  EventTypes.RECONCILIATION_RUN_COMPLETED,
  EventTypes.AI_ACTION_PERFORMED,
  EventTypes.USER_INVITED,
  EventTypes.USER_ROLE_ASSIGNED,
] as const;

export function registerAuditLogListener(): void {
  for (const eventType of AUDITED_EVENTS) {
    eventBus.on(eventType, async (event) => {
      const { entityType, entityId, ...rest } = (event.payload ?? {}) as {
        entityType?: string;
        entityId?: string;
        [key: string]: unknown;
      };

      await prisma.auditLog.create({
        data: {
          organizationId: event.organizationId,
          userId: event.actorId,
          action: event.type.toUpperCase().replace(/\./g, "_"),
          entityType: entityType ?? "unknown",
          entityId: entityId ?? "unknown",
          metadata: rest as object,
        },
      });
    });
  }

  logger.info({ count: AUDITED_EVENTS.length }, "Audit log listener registered");
}
