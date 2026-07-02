/** Format a decimal string or number as Indian Rupees. Always use this for monetary display. */
export function formatCurrency(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "₹0.00";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "₹0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(num);
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(date)
  );
}

export function formatPercent(value: string | number): string {
  return `${value}%`;
}
