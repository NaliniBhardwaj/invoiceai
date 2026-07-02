import type { NextFunction, Request, Response } from "express";
import { ApiError } from "@/shared/utils/api-error";
import { rbacService } from "@/features/rbac/rbac.service";

/**
 * requirePermission('invoice:create') replaces every "if user.role ===
 * ADMIN" check that would otherwise be scattered across controllers. The
 * permission string is the single source of truth for what a route needs;
 * which roles grant it lives entirely in the database (seed.ts + future
 * admin UI), not in route code.
 */
export function requirePermission(permissionKey: string) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      throw ApiError.unauthorized("Authentication required before authorization");
    }

    const allowed = await rbacService.userHasPermission(
      req.user.userId,
      req.user.organizationId,
      permissionKey
    );

    if (!allowed) {
      throw ApiError.forbidden(`Missing required permission: ${permissionKey}`);
    }

    next();
  };
}
