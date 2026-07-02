import { Badge } from "@/components/ui/badge";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "warning" | "destructive" | "success" }> = {
  DRAFT: { label: "Draft", variant: "outline" },
  ISSUED: { label: "Issued", variant: "secondary" },
  PAID: { label: "Paid", variant: "success" },
  PARTIALLY_PAID: { label: "Partial", variant: "warning" },
  OVERDUE: { label: "Overdue", variant: "destructive" },
  CANCELLED: { label: "Cancelled", variant: "outline" },
  OPEN: { label: "Open", variant: "secondary" },
  PARTIALLY_INVOICED: { label: "Partial", variant: "warning" },
  CLOSED: { label: "Closed", variant: "outline" },
  PROCESSING: { label: "Processing", variant: "warning" },
  COMPLETED: { label: "Completed", variant: "success" },
  FAILED: { label: "Failed", variant: "destructive" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_MAP[status] ?? { label: status, variant: "outline" as const };
  return <Badge variant={config.variant as "default" | "secondary" | "outline" | "warning" | "destructive"}>{config.label}</Badge>;
}
