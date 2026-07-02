import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError } from "@/shared/utils/api-error";
import { logger } from "@/config/logger";

/** Duck-type check for Prisma known-request errors without importing the generated namespace. */
function isPrismaKnownError(err: unknown): err is { code: string; meta?: Record<string, unknown> } {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as Record<string, unknown>).code === "string" &&
    "clientVersion" in err
  );
}

/**
 * Single place every error in the app gets translated into an HTTP
 * response. Controllers and services never format error responses
 * themselves — they throw ApiError (or let Zod/Prisma throw) and this
 * middleware does the rest. Keeps error shape consistent across all 40+
 * planned endpoints.
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details ?? null },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: err.flatten(),
      },
    });
    return;
  }

  if (isPrismaKnownError(err)) {
    if (err.code === "P2002") {
      res.status(409).json({
        error: { code: "CONFLICT", message: "A record with this value already exists" },
      });
      return;
    }
    if (err.code === "P2025") {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Record not found" } });
      return;
    }
  }

  logger.error({ err, path: req.path, method: req.method }, "Unhandled error");
  res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "Something went wrong" },
  });
}
