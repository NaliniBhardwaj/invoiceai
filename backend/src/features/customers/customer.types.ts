export interface CustomerDTO {
  id: string;
  name: string;
  companyName: string | null;
  gstNumber: string | null;
  billingAddress: string;
  state: string;
  email: string | null;
  phone: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerHistoryDTO {
  purchaseOrders: Array<{
    id: string;
    poNumber: string;
    status: string;
    createdAt: Date;
  }>;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    status: string;
    grandTotal: string;
    invoiceDate: Date;
    dueDate: Date;
  }>;
  payments: Array<{
    id: string;
    amount: string;
    paidAt: Date;
    invoiceNumber: string;
  }>;
}

export interface CustomerAnalyticsDTO {
  totalCustomers: number;
  customersWithGstNumber: number;
  byState: Array<{ state: string; count: number }>;
  addedLast30Days: number;
}
