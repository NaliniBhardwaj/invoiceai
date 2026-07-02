export interface DashboardSummary {
  revenue: { thisMonth: string; lastMonth: string; changePercent: number };
  outstanding: string;
  invoices: { total: number; draft: number; issued: number; overdue: number; paid: number };
  payments: { thisMonth: string; count: number };
  gst: { cgst: string; sgst: string; igst: string; total: string };
  recentInvoices: Array<{
    id: string;
    invoiceNumber: string;
    customerName: string;
    grandTotal: string;
    status: string;
    dueDate: string;
  }>;
  revenueByMonth: Array<{ month: string; revenue: string }>;
}
