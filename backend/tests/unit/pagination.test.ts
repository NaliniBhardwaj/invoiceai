import { describe, expect, it } from "vitest";
import { buildPaginationMeta, paginationQuerySchema, toSkipTake } from "@/shared/utils/pagination";

describe("pagination utils", () => {
  it("applies defaults when no query params are given", () => {
    const parsed = paginationQuerySchema.parse({});
    expect(parsed).toEqual({ page: 1, limit: 20, sortOrder: "desc" });
  });

  it("coerces string query params to numbers", () => {
    const parsed = paginationQuerySchema.parse({ page: "3", limit: "50" });
    expect(parsed.page).toBe(3);
    expect(parsed.limit).toBe(50);
  });

  it("rejects a limit above the max of 100", () => {
    expect(() => paginationQuerySchema.parse({ limit: "500" })).toThrow();
  });

  it("computes skip/take correctly for page 3 with limit 10", () => {
    const query = paginationQuerySchema.parse({ page: "3", limit: "10" });
    expect(toSkipTake(query)).toEqual({ skip: 20, take: 10 });
  });

  it("computes total pages, rounding up", () => {
    const meta = buildPaginationMeta(101, 1, 20);
    expect(meta.totalPages).toBe(6);
  });
});
