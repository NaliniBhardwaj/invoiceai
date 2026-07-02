import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Prisma } from "@prisma/client";
import { prisma } from "@/shared/prisma/client";
import { env } from "@/config/env";
import { ApiError } from "@/shared/utils/api-error";
import { rbacService } from "@/features/rbac/rbac.service";
import type { LoginInput, RegisterInput } from "@/features/auth/auth.schema";
import type { AuthResponseDTO } from "@/features/auth/auth.types";

class AuthService {
  /**
   * Registration creates the Organization and the registering User in a
   * single transaction, then assigns the OWNER system role. This is the
   * one place in the app where "create an org" and "create a user" are
   * coupled — every other code path operates within an existing org.
   */
  async register(input: RegisterInput): Promise<AuthResponseDTO> {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw ApiError.conflict("An account with this email already exists");
    }

    const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_SALT_ROUNDS);

    const { user, organization } = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const organization = await tx.organization.create({
        data: {
          name: input.organizationName,
          state: input.organizationState,
          gstNumber: input.organizationGstNumber,
        },
      });

      const user = await tx.user.create({
        data: {
          organizationId: organization.id,
          name: input.name,
          email: input.email,
          passwordHash,
        },
      });

      return { user, organization };
    });

    await rbacService.assignSystemRole(user.id, organization.id, "OWNER");

    return this.buildAuthResponse(user.id, organization.id);
  }

  async login(input: LoginInput): Promise<AuthResponseDTO> {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !user.isActive) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    const passwordValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!passwordValid) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    return this.buildAuthResponse(user.id, user.organizationId);
  }

  private async buildAuthResponse(userId: string, organizationId: string): Promise<AuthResponseDTO> {
    const [user, organization, permissions] = await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { id: userId } }),
      prisma.organization.findUniqueOrThrow({ where: { id: organizationId } }),
      rbacService.getUserPermissions(userId, organizationId),
    ]);

    const token = jwt.sign(
      { userId: user.id, organizationId: organization.id, email: user.email },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        organizationId: organization.id,
        organizationName: organization.name,
        permissions,
      },
    };
  }
}

export const authService = new AuthService();
