import type { Request, Response } from "express";
import { asyncHandler } from "@/shared/utils/async-handler";
import { ApiError } from "@/shared/utils/api-error";
import { paymentService } from "@/features/payments/payment.service";
import { paymentQuerySchema, recordPaymentSchema } from "@/features/payments/payment.schema";

function requireUser(req: Request) {
  if (!req.user) throw ApiError.unauthorized();
  return req.user;
}

export const paymentController = {
  record: asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const input = recordPaymentSchema.parse(req.body);
    const payment = await paymentService.record(user.organizationId, user.userId, input);
    res.status(201).json(payment);
  }),

  refund: asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    await paymentService.refund(user.organizationId, user.userId, req.params.id);
    res.status(204).send();
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const user = requireUser(req);
    const query = paymentQuerySchema.parse(req.query);
    const result = await paymentService.list(user.organizationId, query);
    res.status(200).json(result);
  }),
};
