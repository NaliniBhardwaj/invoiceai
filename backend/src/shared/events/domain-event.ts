/**
 * Every meaningful business occurrence in the system is represented as a
 * DomainEvent. Services emit these after their write transaction commits.
 * Listeners (audit logging today; notifications, AI insight triggers, and
 * scheduled-job follow-ups later) subscribe without the emitting service
 * knowing or caring who's listening.
 */
export interface DomainEvent<TPayload = Record<string, unknown>> {
  type: string;
  organizationId: string;
  actorId: string | null;
  payload: TPayload;
  occurredAt: Date;
}

/**
 * Central registry of event type strings. Using a const object (not a
 * loose string) means autocomplete works and typos fail at compile time
 * for both emitters and listeners.
 */
export const EventTypes = {
  // Customers
  CUSTOMER_CREATED: "customer.created",
  CUSTOMER_UPDATED: "customer.updated",
  CUSTOMER_DELETED: "customer.deleted",

  // Invoices
  INVOICE_CREATED: "invoice.created",
  INVOICE_UPDATED: "invoice.updated",
  INVOICE_ISSUED: "invoice.issued",
  INVOICE_PAID: "invoice.paid",
  INVOICE_PARTIALLY_PAID: "invoice.partially_paid",
  INVOICE_OVERDUE: "invoice.overdue",
  INVOICE_CANCELLED: "invoice.cancelled",
  INVOICE_DELETED: "invoice.deleted",

  // Purchase Orders
  PURCHASE_ORDER_CREATED: "purchase_order.created",
  PURCHASE_ORDER_UPDATED: "purchase_order.updated",
  PURCHASE_ORDER_CLOSED: "purchase_order.closed",
  PURCHASE_ORDER_CANCELLED: "purchase_order.cancelled",

  // Payments
  PAYMENT_RECORDED: "payment.recorded",
  PAYMENT_REFUNDED: "payment.refunded",

  // GST / Reconciliation
  GST_SOURCE_UPLOADED: "gst.source_uploaded",
  RECONCILIATION_RUN_STARTED: "reconciliation.run_started",
  RECONCILIATION_RUN_COMPLETED: "reconciliation.run_completed",
  RECONCILIATION_FINDING_DETECTED: "reconciliation.finding_detected",

  // AI
  AI_ACTION_PERFORMED: "ai.action_performed",

  // Identity / RBAC
  USER_INVITED: "user.invited",
  USER_ROLE_ASSIGNED: "user.role_assigned",
} as const;

export type EventType = (typeof EventTypes)[keyof typeof EventTypes];
