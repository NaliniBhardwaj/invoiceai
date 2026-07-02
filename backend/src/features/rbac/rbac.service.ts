import { prisma } from "@/shared/prisma/client";
import { eventBus } from "@/shared/events/event-bus";
import { EventTypes } from "@/shared/events/domain-event";

/**
 * All RBAC reads go through this service. It's deliberately the only
 * place that knows how Role/Permission/RolePermission/UserRole join
 * together — the rbac.middleware just calls userHasPermission and never
 * touches Prisma directly.
 */
class RbacService {
  /**
   * True if the user has, in the given organization, any role that
   * grants the given permission key. A user can hold multiple roles in
   * principle (UserRole has no uniqueness restriction beyond the
   * user+role+org triple), so this checks across all of them.
   */
  async userHasPermission(
    userId: string,
    organizationId: string,
    permissionKey: string
  ): Promise<boolean> {
    const match = await prisma.userRole.findFirst({
      where: {
        userId,
        organizationId,
        role: {
          rolePermissions: {
            some: { permission: { key: permissionKey } },
          },
        },
      },
      select: { id: true },
    });

    return match !== null;
  }

  async getUserPermissions(userId: string, organizationId: string): Promise<string[]> {
    const userRoles = await prisma.userRole.findMany({
      where: { userId, organizationId },
      include: {
        role: {
          include: { rolePermissions: { include: { permission: true } } },
        },
      },
    });

    const permissionKeys = new Set<string>();
    for (const userRole of userRoles) {
      for (const rp of userRole.role.rolePermissions) {
        permissionKeys.add(rp.permission.key);
      }
    }
    return Array.from(permissionKeys);
  }

  /** Assigns a system role (by name) to a user within an organization. Used at signup. */
  async assignSystemRole(
    userId: string,
    organizationId: string,
    roleName: "OWNER" | "ADMIN" | "ACCOUNTANT" | "VIEWER"
  ): Promise<void> {
    const role = await prisma.role.findFirst({
      where: { name: roleName, organizationId: null, isSystem: true },
    });

    if (!role) {
      throw new Error(
        `System role "${roleName}" not found — run "npm run prisma:seed" before starting the app`
      );
    }

    await prisma.userRole.create({
      data: { userId, roleId: role.id, organizationId },
    });

    await eventBus.emit(
      EventTypes.USER_ROLE_ASSIGNED,
      organizationId,
      { entityType: "User", entityId: userId, roleName },
      userId
    );
  }
}

export const rbacService = new RbacService();
