export interface LineItemDTO {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
  lineTotal: string;
}

export interface InvoiceDTO {
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
  invoiceDate: Date;
  dueDate: Date;
  subtotal: string;
  taxPercentage: string;
  cgst: string;
  sgst: string;
  igst: string;
  grandTotal: string;
  isIntraState: boolean;
  pdfUrl: string | null;
  lineItems: LineItemDTO[];
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceAnalyticsDTO {
  totalInvoices: number;
  totalRevenue: string;
  outstanding: string;
  paid: string;
  overdue: string;
  byStatus: Array<{ status: string; count: number; total: string }>;
  byType: Array<{ type: string; count: number }>;
  revenueByMonth: Array<{ month: string; revenue: string }>;
}
