export interface PaymentDTO {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  customerName: string;
  amount: string;
  paidAt: Date;
  method: string | null;
  reference: string | null;
  createdAt: Date;
}
