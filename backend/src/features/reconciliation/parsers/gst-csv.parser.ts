/**
 * Parses a GST CSV export into a normalised GstEntry array.
 * Expected columns (case-insensitive, order-flexible):
 *   gstin, invoicenumber, invoicedate, taxablevalue, igst, cgst, sgst, total
 * Rows with missing GSTIN or invoice number are rejected with a descriptive error.
 */
export interface GstEntry {
  gstin: string;
  invoiceNumber: string;
  invoiceDate: string;
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
  total: number;
}

export function parseGstCsv(csv: string): GstEntry[] {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) throw new Error("CSV must have a header row and at least one data row");

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, ""));

  const colIndex = (name: string): number => {
    const idx = headers.indexOf(name);
    if (idx === -1) throw new Error(`Missing required CSV column: ${name}`);
    return idx;
  };

  const gstinCol = colIndex("gstin");
  const invNumCol = colIndex("invoicenumber");
  const invDateCol = colIndex("invoicedate");
  const taxableCol = colIndex("taxablevalue");
  const igstCol = colIndex("igst");
  const cgstCol = colIndex("cgst");
  const sgstCol = colIndex("sgst");
  const totalCol = colIndex("total");

  return lines.slice(1).map((line, i) => {
    const cols = line.split(",").map((c) => c.trim());
    const gstin = cols[gstinCol];
    const invoiceNumber = cols[invNumCol];
    if (!gstin) throw new Error(`Row ${i + 2}: GSTIN is missing`);
    if (!invoiceNumber) throw new Error(`Row ${i + 2}: Invoice number is missing`);
    return {
      gstin,
      invoiceNumber,
      invoiceDate: cols[invDateCol] ?? "",
      taxableValue: parseFloat(cols[taxableCol] ?? "0") || 0,
      igst: parseFloat(cols[igstCol] ?? "0") || 0,
      cgst: parseFloat(cols[cgstCol] ?? "0") || 0,
      sgst: parseFloat(cols[sgstCol] ?? "0") || 0,
      total: parseFloat(cols[totalCol] ?? "0") || 0,
    };
  });
}
