import { Decimal } from "@prisma/client/runtime/library";

/**
 * GST rule: if the supplier (organization) and buyer (customer) are in
 * the same Indian state → intra-state → split into CGST + SGST (each
 * half the tax rate). If different states → inter-state → IGST at the
 * full rate. This is the legal distinction under CGST Act 2017 and the
 * one piece of logic the assignment explicitly requires to be modelled.
 *
 * All arithmetic uses Prisma's Decimal to avoid floating-point rounding
 * errors on financial amounts — a mandatory constraint from the
 * architecture decisions.
 */

export interface TaxBreakdown {
  subtotal: Decimal;
  taxPercentage: Decimal;
  cgst: Decimal;
  sgst: Decimal;
  igst: Decimal;
  grandTotal: Decimal;
  isIntraState: boolean;
}

export interface LineItemInput {
  quantity: number | string;
  unitPrice: number | string;
}

export function calculateLineTotal(item: LineItemInput): Decimal {
  return new Decimal(item.quantity.toString()).times(new Decimal(item.unitPrice.toString()));
}

export function calculateTax(
  subtotal: Decimal,
  taxPercentageValue: number | string,
  orgState: string,
  customerState: string
): TaxBreakdown {
  const taxPercentage = new Decimal(taxPercentageValue.toString());
  const taxAmount = subtotal.times(taxPercentage).dividedBy(100);

  // Normalise state names to lowercase-trimmed for comparison so
  // "Maharashtra" and "maharashtra" are treated identically.
  const isIntraState =
    orgState.trim().toLowerCase() === customerState.trim().toLowerCase();

  const cgst = isIntraState ? taxAmount.dividedBy(2).toDecimalPlaces(2) : new Decimal(0);
  const sgst = isIntraState ? taxAmount.dividedBy(2).toDecimalPlaces(2) : new Decimal(0);
  const igst = isIntraState ? new Decimal(0) : taxAmount.toDecimalPlaces(2);

  const grandTotal = subtotal.plus(cgst).plus(sgst).plus(igst);

  return {
    subtotal: subtotal.toDecimalPlaces(2),
    taxPercentage,
    cgst,
    sgst,
    igst,
    grandTotal: grandTotal.toDecimalPlaces(2),
    isIntraState,
  };
}
