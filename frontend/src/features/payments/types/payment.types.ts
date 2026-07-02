export interface Payment {
  id: string; invoiceId: string; invoiceNumber: string; customerName: string;
  amount: string; paidAt: string; method: string | null; reference: string | null; createdAt: string;
}
export interface PaginatedPayments {
  data: Payment[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}
