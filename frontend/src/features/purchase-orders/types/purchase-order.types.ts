export interface PurchaseOrder {
  id: string;
  poNumber: string;
  status: "OPEN" | "PARTIALLY_INVOICED" | "CLOSED" | "CANCELLED";
  customerId: string;
  customerName: string;
  customerGstNumber: string | null;
  invoiceCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedPurchaseOrders {
  data: PurchaseOrder[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}
