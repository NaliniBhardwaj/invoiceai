import { describe, expect, it } from "vitest";
import { Decimal } from "@prisma/client/runtime/library";
import { calculateLineTotal, calculateTax } from "@/features/tax/tax-engine";

describe("calculateLineTotal", () => {
  it("multiplies quantity × unitPrice correctly", () => {
    const total = calculateLineTotal({ quantity: 5, unitPrice: 1000 });
    expect(total.toNumber()).toBe(5000);
  });

  it("handles decimal quantities without floating-point error", () => {
    const total = calculateLineTotal({ quantity: "1.5", unitPrice: "999.99" });
    expect(total.toString()).toBe("1499.985");
  });
});

describe("calculateTax — intra-state (CGST + SGST)", () => {
  const subtotal = new Decimal(10000);

  it("splits GST equally into CGST and SGST when org and customer are in the same state", () => {
    const result = calculateTax(subtotal, 18, "Maharashtra", "Maharashtra");
    expect(result.isIntraState).toBe(true);
    expect(result.cgst.toNumber()).toBe(900);
    expect(result.sgst.toNumber()).toBe(900);
    expect(result.igst.toNumber()).toBe(0);
    expect(result.grandTotal.toNumber()).toBe(11800);
  });

  it("is case-insensitive for state comparison", () => {
    const result = calculateTax(subtotal, 18, "maharashtra", "MAHARASHTRA");
    expect(result.isIntraState).toBe(true);
  });

  it("trims whitespace when comparing states", () => {
    const result = calculateTax(subtotal, 18, "  Karnataka ", "Karnataka");
    expect(result.isIntraState).toBe(true);
  });
});

describe("calculateTax — inter-state (IGST)", () => {
  const subtotal = new Decimal(10000);

  it("applies full IGST when org and customer states differ", () => {
    const result = calculateTax(subtotal, 18, "Maharashtra", "Karnataka");
    expect(result.isIntraState).toBe(false);
    expect(result.igst.toNumber()).toBe(1800);
    expect(result.cgst.toNumber()).toBe(0);
    expect(result.sgst.toNumber()).toBe(0);
    expect(result.grandTotal.toNumber()).toBe(11800);
  });

  it("handles 5% GST slab correctly", () => {
    const result = calculateTax(subtotal, 5, "Delhi", "Tamil Nadu");
    expect(result.igst.toNumber()).toBe(500);
    expect(result.grandTotal.toNumber()).toBe(10500);
  });

  it("handles 28% GST slab correctly", () => {
    const result = calculateTax(subtotal, 28, "Delhi", "Tamil Nadu");
    expect(result.igst.toNumber()).toBe(2800);
    expect(result.grandTotal.toNumber()).toBe(12800);
  });
});
