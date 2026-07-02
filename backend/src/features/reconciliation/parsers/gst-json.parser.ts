import type { GstEntry } from "@/features/reconciliation/parsers/gst-csv.parser";

export function parseGstJson(rawJson: string): GstEntry[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    throw new Error("Invalid JSON: could not parse GST data");
  }

  const entries: unknown[] = Array.isArray(parsed) ? parsed : (parsed as { entries?: unknown[] }).entries ?? [];

  return entries.map((entry: unknown, i) => {
    const e = entry as Record<string, unknown>;
    const gstin = String(e.gstin ?? e.GSTIN ?? "");
    const invoiceNumber = String(e.invoiceNumber ?? e.invoice_number ?? e.InvoiceNumber ?? "");
    if (!gstin) throw new Error(`Entry ${i}: GSTIN is missing`);
    if (!invoiceNumber) throw new Error(`Entry ${i}: invoiceNumber is missing`);
    return {
      gstin,
      invoiceNumber,
      invoiceDate: String(e.invoiceDate ?? e.invoice_date ?? ""),
      taxableValue: Number(e.taxableValue ?? e.taxable_value ?? 0),
      igst: Number(e.igst ?? e.IGST ?? 0),
      cgst: Number(e.cgst ?? e.CGST ?? 0),
      sgst: Number(e.sgst ?? e.SGST ?? 0),
      total: Number(e.total ?? e.Total ?? 0),
    };
  });
}
