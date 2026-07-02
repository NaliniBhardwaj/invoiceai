import { createApp } from "@/app";
import { env } from "@/config/env";
import { logger } from "@/config/logger";
import { registerAuditLogListener } from "@/shared/events/listeners/audit-log.listener";
import { registerJobs } from "@/shared/jobs";

function bootstrap(): void {
  // Event listeners must be registered before any request can emit an
  // event, otherwise the first invoice/payment/etc. created after boot
  // would silently skip audit logging.
  registerAuditLogListener();
  registerJobs();

  const app = createApp();

  app.listen(env.PORT, () => {
    logger.info(`InvoiceAI backend listening on port ${env.PORT} [${env.NODE_ENV}]`);
  });
}

bootstrap();
