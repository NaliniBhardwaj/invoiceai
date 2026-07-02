import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "@/config/env";
import { ApiError } from "@/shared/utils/api-error";

export interface AuthenticatedUser {
  userId: string;
  organizationId: string;
  email: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

interface JwtPayload {
  userId: string;
  organizationId: string;
  email: string;
}

/**
 * Verifies the bearer JWT and attaches a typed `req.user`. Every protected
 * route runs this before any permission check — authentication (who are
 * you) is always resolved before authorization (what can you do).
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw ApiError.unauthorized("Missing or malformed Authorization header");
  }

  const token = header.slice("Bearer ".length);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = {
      userId: payload.userId,
      organizationId: payload.organizationId,
      email: payload.email,
    };
    next();
  } catch {
    throw ApiError.unauthorized("Invalid or expired token");
  }
}
