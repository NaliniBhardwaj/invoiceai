export interface LineItem {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
  lineTotal: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  type: string;
  status: string;
  customerId: string;
  customerName: string;
  customerCompany: string | null;
  customerGstNumber: string | null;
  customerBillingAddress: string;
  customerState: string;
  purchaseOrderId: string | null;
  purchaseOrderNumber: string | null;
  subscriptionPlan: string | null;
  subscriptionDuration: number | null;
  invoiceDate: string;
  dueDate: string;
  subtotal: string;
  taxPercentage: string;
  cgst: string;
  sgst: string;
  igst: string;
  grandTotal: string;
  isIntraState: boolean;
  pdfUrl: string | null;
  lineItems: LineItem[];
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceAnalytics {
  totalInvoices: number;
  totalRevenue: string;
  outstanding: string;
  paid: string;
  overdue: string;
  byStatus: Array<{ status: string; count: number; total: string }>;
  byType: Array<{ type: string; count: number }>;
  revenueByMonth: Array<{ month: string; revenue: string }>;
}

export interface PaginatedInvoices {
  data: Invoice[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}
