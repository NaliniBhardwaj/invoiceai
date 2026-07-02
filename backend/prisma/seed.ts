import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Permission keys follow a strict "resource:action" convention.
 * Adding a new resource later (e.g. "notification:send") never requires
 * touching existing rows — it's an insert plus a RolePermission link.
 */
const PERMISSIONS = [
  // Invoices
  "invoice:create",
  "invoice:read",
  "invoice:update",
  "invoice:delete",
  "invoice:export",
  // Customers
  "customer:create",
  "customer:read",
  "customer:update",
  "customer:delete",
  // Purchase Orders
  "purchase_order:create",
  "purchase_order:read",
  "purchase_order:update",
  // Payments
  "payment:record",
  "payment:read",
  "payment:refund",
  // Reconciliation
  "reconciliation:run",
  "reconciliation:read",
  "gst_source:upload",
  // Reports & Dashboard
  "report:read",
  "report:export",
  "dashboard:read",
  // AI
  "ai:use",
  // Org & people management
  "user:invite",
  "user:manage",
  "role:manage",
  "organization:manage",
  // Audit
  "audit_log:read",
] as const;

/** System role → permission bundle. OWNER always gets everything. */
const ROLE_PERMISSIONS: Record<string, readonly string[]> = {
  OWNER: PERMISSIONS,
  ADMIN: PERMISSIONS.filter(
    (p) => p !== "organization:manage" // org-level deletion/billing stays OWNER-only
  ),
  ACCOUNTANT: [
    "invoice:create",
    "invoice:read",
    "invoice:update",
    "invoice:export",
    "customer:create",
    "customer:read",
    "customer:update",
    "purchase_order:create",
    "purchase_order:read",
    "purchase_order:update",
    "payment:record",
    "payment:read",
    "payment:refund",
    "reconciliation:run",
    "reconciliation:read",
    "gst_source:upload",
    "report:read",
    "report:export",
    "dashboard:read",
    "ai:use",
  ],
  VIEWER: [
    "invoice:read",
    "customer:read",
    "purchase_order:read",
    "payment:read",
    "reconciliation:read",
    "report:read",
    "dashboard:read",
    "ai:use",
  ],
};

async function main(): Promise<void> {
  console.log("Seeding permissions...");
  for (const key of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key },
      update: {},
      create: { key },
    });
  }

  console.log("Seeding system roles...");
  for (const [roleName, permissionKeys] of Object.entries(ROLE_PERMISSIONS)) {
    let role = await prisma.role.findFirst({
      where: { name: roleName, organizationId: null },
    });
    if (!role) {
      role = await prisma.role.create({
        data: { name: roleName, isSystem: true, organizationId: null },
      });
    }

    const permissions = await prisma.permission.findMany({
      where: { key: { in: [...permissionKeys] } },
    });

    for (const permission of permissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: role.id, permissionId: permission.id },
        },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }

    console.log(`  ${roleName}: ${permissions.length} permissions`);
  }

  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
