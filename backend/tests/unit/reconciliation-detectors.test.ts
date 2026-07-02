import { describe, expect, it } from "vitest";
import {
  detectMissingInvoices,
  detectGstMismatch,
  detectAmountMismatch,
  detectDuplicateInvoices,
  detectDuplicateGstEntries,
  detectMissingPayments,
  detectTaxMismatch,
  type InvoiceRecord,
} from "@/features/reconciliation/detectors/index";
import type { GstEntry } from "@/features/reconciliation/parsers/gst-csv.parser";

const inv = (overrides: Partial<InvoiceRecord> = {}): InvoiceRecord => ({
  id: "inv-1",
  invoiceNumber: "INV-2026-00001",
  customerGstNumber: "27AAPFU0939F1ZV",
  grandTotal: "11800.00",
  cgst: "900.00",
  sgst: "900.00",
  igst: "0.00",
  status: "ISSUED",
  ...overrides,
});

const gst = (overrides: Partial<GstEntry> = {}): GstEntry => ({
  gstin: "27AAPFU0939F1ZV",
  invoiceNumber: "INV-2026-00001",
  invoiceDate: "2026-03-01",
  taxableValue: 10000,
  igst: 0,
  cgst: 900,
  sgst: 900,
  total: 11800,
  ...overrides,
});

describe("detectMissingInvoices", () => {
  it("flags a GST entry whose invoice is absent from the system", () => {
    const findings = detectMissingInvoices([gst({ invoiceNumber: "INV-GHOST" })], [inv()]);
    expect(findings).toHaveLength(1);
    expect(findings[0].type).toBe("MISSING_INVOICE");
    expect(findings[0].severity).toBe("HIGH");
  });

  it("returns no findings when all GST entries match system invoices", () => {
    const findings = detectMissingInvoices([gst()], [inv()]);
    expect(findings).toHaveLength(0);
  });
});

describe("detectGstMismatch", () => {
  it("flags when GST entry GSTIN differs from customer GSTIN", () => {
    const findings = detectGstMismatch([gst({ gstin: "29WRONG00000Z1" })], [inv()]);
    expect(findings).toHaveLength(1);
    expect(findings[0].type).toBe("GST_MISMATCH");
    expect(findings[0].expectedValue).toBe("27AAPFU0939F1ZV");
    expect(findings[0].actualValue).toBe("29WRONG00000Z1");
  });

  it("returns no findings when GSTINs match", () => {
    expect(detectGstMismatch([gst()], [inv()])).toHaveLength(0);
  });
});

describe("detectAmountMismatch", () => {
  it("flags when totals differ beyond the 1% tolerance", () => {
    const findings = detectAmountMismatch([gst({ total: 9000 })], [inv()]);
    expect(findings).toHaveLength(1);
    expect(findings[0].type).toBe("AMOUNT_MISMATCH");
  });

  it("ignores sub-penny rounding differences", () => {
    const findings = detectAmountMismatch([gst({ total: 11800.005 })], [inv()]);
    expect(findings).toHaveLength(0);
  });
});

describe("detectDuplicateInvoices", () => {
  it("flags when the same invoice number appears twice in the system", () => {
    const findings = detectDuplicateInvoices([
      inv({ id: "a" }),
      inv({ id: "b", invoiceNumber: "INV-2026-00001" }),
    ]);
    expect(findings).toHaveLength(1);
    expect(findings[0].type).toBe("DUPLICATE_INVOICE");
  });
});

describe("detectDuplicateGstEntries", () => {
  it("flags when the same GSTIN+invoice combination appears twice in the GST file", () => {
    const findings = detectDuplicateGstEntries([gst(), gst()]);
    expect(findings).toHaveLength(1);
    expect(findings[0].type).toBe("DUPLICATE_GST_ENTRY");
  });
});

describe("detectMissingPayments", () => {
  it("flags ISSUED invoices with no payment record", () => {
    const findings = detectMissingPayments([inv()], new Set());
    expect(findings).toHaveLength(1);
    expect(findings[0].type).toBe("MISSING_PAYMENT");
  });

  it("does not flag invoices that have been paid", () => {
    const findings = detectMissingPayments([inv()], new Set(["inv-1"]));
    expect(findings).toHaveLength(0);
  });
});

describe("detectTaxMismatch", () => {
  it("flags when CGST in the system differs from the GST file", () => {
    const findings = detectTaxMismatch([gst({ cgst: 500 })], [inv()]);
    expect(findings.some((f) => f.type === "TAX_MISMATCH")).toBe(true);
  });
});
