import { describe, expect, it } from "vitest";
import { ApiError } from "@/shared/utils/api-error";

describe("ApiError", () => {
  it("badRequest produces a 400 with BAD_REQUEST code", () => {
    const error = ApiError.badRequest("Invalid input");
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe("BAD_REQUEST");
    expect(error.message).toBe("Invalid input");
  });

  it("notFound defaults to a generic message when none is given", () => {
    const error = ApiError.notFound();
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe("Resource not found");
  });

  it("forbidden carries the FORBIDDEN code", () => {
    const error = ApiError.forbidden();
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe("FORBIDDEN");
  });
});
