import { z } from "zod";
import { paginationQuerySchema } from "@/shared/utils/pagination";

export const createCustomerSchema = z.object({
  name: z.string().min(2).max(150),
  companyName: z.string().max(150).optional(),
  gstNumber: z
    .string()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Enter a valid 15-character GSTIN")
    .optional()
    .or(z.literal("")),
  billingAddress: z.string().min(5).max(500),
  state: z.string().min(2).max(60),
  email: z.string().email().optional().or(z.literal("")),
  phone: z
    .string()
    .regex(/^[0-9+\-\s()]{7,20}$/, "Enter a valid phone number")
    .optional()
    .or(z.literal("")),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const customerQuerySchema = paginationQuerySchema.extend({
  state: z.string().optional(),
  hasGstNumber: z.coerce.boolean().optional(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CustomerQuery = z.infer<typeof customerQuerySchema>;
