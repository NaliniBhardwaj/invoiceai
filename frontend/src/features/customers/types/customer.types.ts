export interface Customer {
  id: string;
  name: string;
  companyName: string | null;
  gstNumber: string | null;
  billingAddress: string;
  state: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerHistory {
  purchaseOrders: Array<{ id: string; poNumber: string; status: string; createdAt: string }>;
  invoices: Array<{ id: string; invoiceNumber: string; status: string; grandTotal: string; invoiceDate: string; dueDate: string }>;
  payments: Array<{ id: string; amount: string; paidAt: string; invoiceNumber: string }>;
}

export interface CustomerAnalytics {
  totalCustomers: number;
  customersWithGstNumber: number;
  byState: Array<{ state: string; count: number }>;
  addedLast30Days: number;
}

export interface PaginatedCustomers {
  data: Customer[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}
