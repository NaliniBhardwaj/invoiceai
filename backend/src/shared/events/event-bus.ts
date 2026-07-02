import { EventEmitter } from "node:events";
import { prisma } from "@/shared/prisma/client";
import { logger } from "@/config/logger";
import type { DomainEvent, EventType } from "@/shared/events/domain-event";

type EventHandler<TPayload = Record<string, unknown>> = (
  event: DomainEvent<TPayload>
) => Promise<void> | void;

/**
 * In-process pub/sub backed by Node's EventEmitter. The public interface
 * (emit/on) is intentionally the entire surface area any caller touches —
 * if this is later replaced with Redis pub/sub or a real message queue,
 * every emit() and on() call site in the codebase stays unchanged.
 *
 * Every emitted event is also persisted to DomainEventLog for replay,
 * debugging, and as the seam for a future transactional outbox.
 */
class EventBus {
  private readonly emitter = new EventEmitter();

  constructor() {
    // Many feature listeners can subscribe to the same event type
    // (e.g. audit logging + future notifications both listen to
    // invoice.created) — raise the default limit to avoid false warnings.
    this.emitter.setMaxListeners(50);
  }

  async emit<TPayload = Record<string, unknown>>(
    type: EventType,
    organizationId: string,
    payload: TPayload,
    actorId: string | null = null
  ): Promise<void> {
    const event: DomainEvent<TPayload> = {
      type,
      organizationId,
      actorId,
      payload,
      occurredAt: new Date(),
    };

    try {
      await prisma.domainEventLog.create({
        data: {
          organizationId,
          type,
          actorId,
          payload: payload as object,
          occurredAt: event.occurredAt,
        },
      });
    } catch (error) {
      // Persisting the log must never block the business operation that
      // already committed — log loudly and continue dispatching.
      logger.error({ err: error, eventType: type }, "Failed to persist domain event log");
    }

    this.emitter.emit(type, event);
  }

  on<TPayload = Record<string, unknown>>(
    type: EventType,
    handler: EventHandler<TPayload>
  ): void {
    this.emitter.on(type, (event: DomainEvent<TPayload>) => {
      Promise.resolve(handler(event)).catch((error) => {
        logger.error({ err: error, eventType: type }, "Domain event handler threw");
      });
    });
  }
}

export const eventBus = new EventBus();
