import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "@/config/env";
import { requestLogger } from "@/shared/middleware/request-logger";
import { apiRateLimiter } from "@/shared/middleware/rate-limiter";
import { errorHandler } from "@/shared/middleware/error-handler";
import { authRoutes } from "@/features/auth/auth.routes";
import { customerRoutes } from "@/features/customers/customer.routes";
import { purchaseOrderRoutes } from "@/features/purchase-orders/purchase-order.routes";
import { invoiceRoutes } from "@/features/invoices/invoice.routes";
import { paymentRoutes } from "@/features/payments/payment.routes";
import { reconciliationRoutes } from "@/features/reconciliation/reconciliation.routes";
import { dashboardRoutes } from "@/features/dashboard/dashboard.routes";
import { aiAssistantRoutes } from "@/features/ai-assistant/ai-assistant.routes";

export function createApp(): Express {
  const app = express();

  // ── Security & parsing ────────────────────────────────
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    })
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);

  // Registered before the rate limiter deliberately: deployment platforms
  // (Railway/Render) poll this frequently for liveness, and a health
  // check that can itself get rate-limited is a self-inflicted false
  // "unhealthy" signal under load — exactly when you most need it to work.
  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.use(apiRateLimiter);

  const apiPrefix = `/api/${env.API_VERSION}`;

  // ── Feature routes ─────────────────────────────────────
  app.use(`${apiPrefix}/auth`, authRoutes);
  app.use(`${apiPrefix}/customers`, customerRoutes);
  app.use(`${apiPrefix}/purchase-orders`, purchaseOrderRoutes);
  app.use(`${apiPrefix}/invoices`, invoiceRoutes);
  app.use(`${apiPrefix}/payments`, paymentRoutes);
  app.use(`${apiPrefix}/reconciliation`, reconciliationRoutes);
  app.use(`${apiPrefix}/dashboard`, dashboardRoutes);
  app.use(`${apiPrefix}/ai`, aiAssistantRoutes);

  // ── 404 + centralized error handling ───────────────────
  app.use((req, res) => {
    res.status(404).json({ error: { code: "NOT_FOUND", message: `No route for ${req.method} ${req.path}` } });
  });
  app.use(errorHandler);

  return app;
}
