import type { GstEntry } from "@/features/reconciliation/parsers/gst-csv.parser";

export interface FindingInput {
  type:
    | "MISSING_INVOICE"
    | "MISSING_PAYMENT"
    | "GST_MISMATCH"
    | "AMOUNT_MISMATCH"
    | "TAX_MISMATCH"
    | "DUPLICATE_INVOICE"
    | "DUPLICATE_GST_ENTRY";
  severity: "LOW" | "MEDIUM" | "HIGH";
  invoiceId?: string;
  description: string;
  expectedValue?: string;
  actualValue?: string;
}

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  customerGstNumber: string | null;
  grandTotal: string;
  cgst: string;
  sgst: string;
  igst: string;
  status: string;
}

// ── Detector 1: GST entries referencing invoices not in the system ────
export function detectMissingInvoices(
  gstEntries: GstEntry[],
  systemInvoices: InvoiceRecord[]
): FindingInput[] {
  const systemNumbers = new Set(systemInvoices.map((inv) => inv.invoiceNumber));
  return gstEntries
    .filter((e) => !systemNumbers.has(e.invoiceNumber))
    .map((e) => ({
      type: "MISSING_INVOICE",
      severity: "HIGH",
      description: `GST entry for invoice ${e.invoiceNumber} (GSTIN: ${e.gstin}) has no matching invoice in the system`,
      actualValue: e.invoiceNumber,
    }));
}

// ── Detector 2: System invoices absent from the GST file ─────────────
export function detectMissingGstEntries(
  gstEntries: GstEntry[],
  systemInvoices: InvoiceRecord[]
): FindingInput[] {
  const gstNumbers = new Set(gstEntries.map((e) => e.invoiceNumber));
  return systemInvoices
    .filter((inv) => inv.status !== "CANCELLED" && !gstNumbers.has(inv.invoiceNumber))
    .map((inv) => ({
      type: "MISSING_INVOICE",
      severity: "HIGH",
      invoiceId: inv.id,
      description: `Invoice ${inv.invoiceNumber} is not present in the GST file`,
      expectedValue: inv.invoiceNumber,
    }));
}

// ── Detector 3: GSTIN on GST entry doesn't match customer's GSTIN ────
export function detectGstMismatch(
  gstEntries: GstEntry[],
  systemInvoices: InvoiceRecord[]
): FindingInput[] {
  const byNumber = new Map(systemInvoices.map((inv) => [inv.invoiceNumber, inv]));
  return gstEntries.flatMap((e) => {
    const inv = byNumber.get(e.invoiceNumber);
    if (!inv || !inv.customerGstNumber) return [];
    if (inv.customerGstNumber !== e.gstin) {
      return [
        {
          type: "GST_MISMATCH" as const,
          severity: "HIGH" as const,
          invoiceId: inv.id,
          description: `Invoice ${e.invoiceNumber}: GSTIN mismatch`,
          expectedValue: inv.customerGstNumber,
          actualValue: e.gstin,
        },
      ];
    }
    return [];
  });
}

// ── Detector 4: Invoice total differs from GST entry total ────────────
export function detectAmountMismatch(
  gstEntries: GstEntry[],
  systemInvoices: InvoiceRecord[],
  tolerancePercent = 0.01
): FindingInput[] {
  const byNumber = new Map(systemInvoices.map((inv) => [inv.invoiceNumber, inv]));
  return gstEntries.flatMap((e) => {
    const inv = byNumber.get(e.invoiceNumber);
    if (!inv) return [];
    const sysTotal = parseFloat(inv.grandTotal);
    const diff = Math.abs(sysTotal - e.total);
    const toleranceAmt = sysTotal * tolerancePercent;
    if (diff > toleranceAmt && diff > 0.01) {
      return [
        {
          type: "AMOUNT_MISMATCH" as const,
          severity: "HIGH" as const,
          invoiceId: inv.id,
          description: `Invoice ${e.invoiceNumber}: amount mismatch (difference: ₹${diff.toFixed(2)})`,
          expectedValue: sysTotal.toFixed(2),
          actualValue: e.total.toFixed(2),
        },
      ];
    }
    return [];
  });
}

// ── Detector 5: Tax component (CGST/SGST/IGST) differs ───────────────
export function detectTaxMismatch(
  gstEntries: GstEntry[],
  systemInvoices: InvoiceRecord[]
): FindingInput[] {
  const byNumber = new Map(systemInvoices.map((inv) => [inv.invoiceNumber, inv]));
  const findings: FindingInput[] = [];

  for (const e of gstEntries) {
    const inv = byNumber.get(e.invoiceNumber);
    if (!inv) continue;

    const pairs: Array<[string, number, number]> = [
      ["CGST", parseFloat(inv.cgst), e.cgst],
      ["SGST", parseFloat(inv.sgst), e.sgst],
      ["IGST", parseFloat(inv.igst), e.igst],
    ];

    for (const [label, sysVal, gstVal] of pairs) {
      if (Math.abs(sysVal - gstVal) > 0.01) {
        findings.push({
          type: "TAX_MISMATCH",
          severity: "MEDIUM",
          invoiceId: inv.id,
          description: `Invoice ${e.invoiceNumber}: ${label} mismatch`,
          expectedValue: sysVal.toFixed(2),
          actualValue: gstVal.toFixed(2),
        });
      }
    }
  }
  return findings;
}

// ── Detector 6: Duplicate invoice numbers in the system ───────────────
export function detectDuplicateInvoices(systemInvoices: InvoiceRecord[]): FindingInput[] {
  const seen = new Map<string, string>();
  const findings: FindingInput[] = [];
  for (const inv of systemInvoices) {
    if (seen.has(inv.invoiceNumber)) {
      findings.push({
        type: "DUPLICATE_INVOICE",
        severity: "HIGH",
        invoiceId: inv.id,
        description: `Duplicate invoice number ${inv.invoiceNumber} found in system`,
        actualValue: inv.invoiceNumber,
      });
    } else {
      seen.set(inv.invoiceNumber, inv.id);
    }
  }
  return findings;
}

// ── Detector 7: Duplicate invoice numbers in the GST file ────────────
export function detectDuplicateGstEntries(gstEntries: GstEntry[]): FindingInput[] {
  const seen = new Set<string>();
  const findings: FindingInput[] = [];
  for (const e of gstEntries) {
    const key = `${e.gstin}::${e.invoiceNumber}`;
    if (seen.has(key)) {
      findings.push({
        type: "DUPLICATE_GST_ENTRY",
        severity: "MEDIUM",
        description: `Duplicate GST entry: invoice ${e.invoiceNumber} for GSTIN ${e.gstin}`,
        actualValue: e.invoiceNumber,
      });
    } else {
      seen.add(key);
    }
  }
  return findings;
}

// ── Detector 8: Issued invoices with no payment records ───────────────
export function detectMissingPayments(
  systemInvoices: InvoiceRecord[],
  paidInvoiceIds: Set<string>
): FindingInput[] {
  return systemInvoices
    .filter(
      (inv) =>
        (inv.status === "ISSUED" || inv.status === "OVERDUE") &&
        !paidInvoiceIds.has(inv.id)
    )
    .map((inv) => ({
      type: "MISSING_PAYMENT" as const,
      severity: "MEDIUM" as const,
      invoiceId: inv.id,
      description: `Invoice ${inv.invoiceNumber} (status: ${inv.status}) has no payment recorded`,
      expectedValue: inv.grandTotal,
    }));
}
