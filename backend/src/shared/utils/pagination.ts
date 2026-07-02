import { z } from "zod";

/**
 * Shared query-param contract every list endpoint accepts, satisfying the
 * "every API must support pagination, filtering, sorting, search" rule
 * in one place instead of re-implementing it per feature.
 */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().optional(),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number
): PaginatedResult<unknown>["meta"] {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

export function toSkipTake(query: PaginationQuery): { skip: number; take: number } {
  return { skip: (query.page - 1) * query.limit, take: query.limit };
}
